import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    restaurantId: {
        type: Number,
        ref: 'Restaurant',
        required: true
    },
    userId: {
        type: Number,
        ref: 'User',
        required: true
    },
    orderId: {
        type: Number,
        ref: 'Order',
        required: true,
        unique: true
    },
    orderReference: { type: String, default: null },
    
    isInquiry: {
        type: Boolean,
        default: false
    },
    
    lastMessage: {
        text: { type: String, default: '' },
        sender: { 
            type: String, 
            enum: ['user', 'restaurant']
        },
        timestamp: { type: Date, default: Date.now }
    },
    
    unreadCountUser: { type: Number, default: 0 },
    unreadCountRestaurant: { type: Number, default: 0 },
    
    status: { 
        type: String, 
        enum: ['active', 'archived', 'resolved'], 
        default: 'active' 
    },
    
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    
    sender: {
        type: { 
            type: String, 
            enum: ['user', 'restaurant'], 
            required: true 
        },
        id: {
            type: Number,
            required: true
        }
    },
    
    messageType: { 
        type: String, 
        enum: ['text', 'image', 'order_update', 'system'], 
        default: 'text' 
    },
    text: { type: String, required: false },
    attachments: {
        type: {
            fileType: { type: String, enum: ['image', 'file'] },
            url: { type: String, required: true },
            name: { type: String },
            size: { type: Number }
        },
        required: false
    },
    readBy: {
        user: {
        isRead: { type: Boolean, default: false },
        readAt: { type: Date, default: null }
        },
        restaurant: {
        isRead: { type: Boolean, default: false },
        readAt: { type: Date, default: null },
        }
    },
    
    deliveredAt: { type: Date, default: null }
}, { timestamps: true });

chatSchema.index({ restaurantId: 1, updatedAt: -1 });
chatSchema.index({ userId: 1, updatedAt: -1 });
chatSchema.index({ orderId: 1 }, { unique: true });
chatSchema.index({ status: 1, updatedAt: -1 });

messageSchema.index({ chatId: 1, createdAt: 1 });
messageSchema.index({ 'sender.id': 1, 'sender.type': 1 });
messageSchema.index({ createdAt: 1 });

// Export models
export const Chat = mongoose.model('Chat', chatSchema);
export const Message = mongoose.model('Message', messageSchema);