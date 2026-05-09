import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import Product from '../models/Product';
import Counter from '../models/Counter';
import Settings from '../models/Settings';
import { io } from '../index';

const getNextSequence = async (name: string, resetDaily = false) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let counter = await Counter.findOne({ name });

  if (!counter) {
    counter = new Counter({ name, count: 1, lastResetDate: today });
  } else {
    if (resetDaily && counter.lastResetDate && counter.lastResetDate < today) {
      counter.count = 1;
      counter.lastResetDate = today;
    } else {
      counter.count += 1;
    }
  }

  await counter.save();
  return counter.count;
};

export const placeOrder = async (req: Request, res: Response) => {
  try {
    const { customerName, customerPhone, customerAddress, tableNumber, items } = req.body;
    const rawUserId = (req as any).user?.userId || (req as any).user?.id;
    const userId = rawUserId ? new mongoose.Types.ObjectId(rawUserId) : null; 

    let subtotal = 0;
    let totalCost = 0;

    const orderItems = await Promise.all(items.map(async (item: any) => {
      const product = await Product.findById(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);
      
      // Stock Validation
      const availableStock = product.stock || 0;
      if (availableStock < item.quantity) {
        throw new Error(`Only ${availableStock} ${product.name} left. Cannot order ${item.quantity}.`);
      }

      const itemTotal = product.price * item.quantity;
      const itemCost = product.costPrice * item.quantity;
      
      subtotal += itemTotal;
      totalCost += itemCost;

      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image
      };
    }));

    const settings = await Settings.findOne();
    const showTax = settings?.showTaxOnReceipt || false;
    const taxRate = showTax ? (settings?.taxRate || 0) : 0;
    
    const gstAmount = Math.round(subtotal * (taxRate / 100));
    const netAmount = subtotal + gstAmount;
    const profit = subtotal - totalCost;

    const billCount = await getNextSequence('billNo');
    const token = await getNextSequence('token', true); // Reset token daily

    const billNo = `INV-${billCount.toString().padStart(4, '0')}`;

    const newOrder = new Order({
      userId,
      customerName,
      customerPhone,
      customerAddress,
      tableNumber,
      billNo,
      token,
      items: orderItems,
      totalAmount: subtotal,
      gstAmount,
      netAmount,
      totalCost,
      profit,
      status: 'pending',
      showTax
    });

    await newOrder.save();

    // Decrement Stock
    await Promise.all(items.map(async (item: any) => {
      await Product.findByIdAndUpdate(item.productId, { 
        $inc: { stock: -item.quantity } 
      });
    }));

    // Notify admin via Socket.io
    io.emit('newOrder', newOrder);

    res.status(201).json(newOrder);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const rawUserId = (req as any).user?.userId || (req as any).user?.id;
    if (!rawUserId) {
      return res.status(401).json({ message: 'Unauthorized: No user ID in token' });
    }

    const userId = new mongoose.Types.ObjectId(rawUserId);
    
    // Find orders matching either the ObjectId or the string representation
    const orders = await Order.find({ 
      $or: [
        { userId: userId },
        { userId: rawUserId }
      ]
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    let query = {};

    if (date) {
      const startOfDay = new Date(date as string);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date as string);
      endOfDay.setHours(23, 59, 59, 999);

      query = {
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, statusMessage } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      id, 
      { status, statusMessage }, 
      { returnDocument: 'after' }
    );
    if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });

    // Notify client about status update
    io.emit('orderStatusUpdated', updatedOrder);

    res.json(updatedOrder);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDailyStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Order.aggregate([
      { $match: { createdAt: { $gte: today }, status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalSales: { 
            $sum: { 
              $cond: [
                { $eq: ["$status", "completed"] }, 
                "$netAmount", 
                0 
              ] 
            } 
          },
          totalProfit: { 
            $sum: { 
              $cond: [
                { $eq: ["$status", "completed"] }, 
                "$profit", 
                0 
              ] 
            } 
          },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    res.json(stats[0] || { totalSales: 0, totalProfit: 0, totalOrders: 0 });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


// export const getDailyStats = async (req: Request, res: Response) => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const orders = await Order.find({
//       createdAt: { $gte: today },
//     });

//     const completedOrders = orders.filter(
//       (o) => o.status === 'completed' || o.status === 'accepted'
//     );

//     const totalOrders = orders.length;

//     const totalSales = completedOrders.reduce(
//       (sum, o) => sum + o.totalAmount,
//       0
//     );

//     const totalProfit = completedOrders.reduce(
//       (sum, o) => sum + o.profit,
//       0
//     );

//     // ⏱ PREP TIME CALCULATION
//     let totalPrepTime = 0;
//     let prepCount = 0;

//     completedOrders.forEach((o) => {
//       if (o.updatedAt && o.createdAt) {
//         const diff =
//           (new Date(o.updatedAt).getTime() -
//             new Date(o.createdAt).getTime()) /
//           60000;

//         if (diff > 0) {
//           totalPrepTime += diff;
//           prepCount++;
//         }
//       }
//     });

//     const avgPrepTime =
//       prepCount > 0 ? (totalPrepTime / prepCount).toFixed(1) : 0;

//     // ⚡ EFFICIENCY LOGIC (REALISTIC)
//     const efficiency =
//       totalOrders > 0
//         ? Math.round((completedOrders.length / totalOrders) * 100)
//         : 0;

//     res.json({
//       totalSales,
//       totalProfit,
//       totalOrders,
//       avgPrepTime,
//       efficiency,
//     });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
// };



export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { billNo, reason } = req.body;

    if (!billNo || !reason) {
      return res.status(400).json({ message: 'Invoice Number and Reason are required' });
    }

    const order = await Order.findOne({ billNo });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    // Update status and reason
    order.status = 'cancelled';
    order.cancelReason = reason;
    await order.save();

    // Return items to stock
    await Promise.all(order.items.map(async (item: any) => {
      await Product.findByIdAndUpdate(item.productId, { 
        $inc: { stock: item.quantity } 
      });
    }));

    // Notify dashboard
    io.emit('orderStatusUpdated', order);

    res.json({ message: 'Order cancelled and stock returned successfully', order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
