// Standalone LocalStorage & BroadcastChannel State Manager for TastyGo
class TastyGoApp {
    constructor() {
        this.STORAGE_KEY = 'tastygo_orders_db';
        this.channel = new BroadcastChannel('tastygo_sync');
        this.initDefaultData();
    }

    initDefaultData() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            const defaultOrders = [
                {
                    token: "TK-104",
                    customer_name: "Dhoni",
                    status: "PLACED",
                    total_price: 164.00,
                    notes: "Extra cheese please",
                    created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    items: [
                        { name: "Crispy Veg Cheese Burger", quantity: 1, price: 89.00 },
                        { name: "Thick Cold Coffee with Ice Cream", quantity: 1, price: 75.00 }
                    ]
                },
                {
                    token: "TK-103",
                    customer_name: "Hardik Pandya",
                    status: "PREPARING",
                    total_price: 180.00,
                    notes: "",
                    created_at: new Date(Date.now() - 300000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    items: [
                        { name: "Peri Peri French Fries", quantity: 1, price: 70.00 },
                        { name: "Steamed Momos", quantity: 1, price: 110.00 }
                    ]
                },
                {
                    token: "TK-102",
                    customer_name: "John",
                    status: "READY",
                    total_price: 120.00,
                    notes: "",
                    created_at: new Date(Date.now() - 600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    items: [
                        { name: "Chinese Veg Hakka Noodles", quantity: 1, price: 120.00 }
                    ]
                }
            ];
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaultOrders));
        }
    }

    getOrders() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    saveOrders(orders) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
    }

    getOrder(token) {
        const orders = this.getOrders();
        return orders.find(o => o.token === token) || null;
    }

    createOrder(customerName, cartItems, notes = '') {
        const orders = this.getOrders();
        const num = Math.floor(100 + Math.random() * 900);
        const token = `TK-${num}`;
        
        let totalPrice = 0;
        const formattedItems = cartItems.map(item => {
            totalPrice += item.price * item.quantity;
            return {
                name: item.name,
                quantity: item.quantity,
                price: item.price
            };
        });

        const newOrder = {
            token: token,
            customer_name: customerName || "Student",
            status: "PLACED",
            total_price: totalPrice,
            notes: notes,
            created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            items: formattedItems
        };

        orders.unshift(newOrder);
        this.saveOrders(orders);

        // Broadcast to all active tabs
        this.channel.postMessage({
            type: 'NEW_ORDER',
            order: newOrder
        });

        return newOrder;
    }

    updateOrderStatus(token, newStatus) {
        const orders = this.getOrders();
        const order = orders.find(o => o.token === token);
        if (order) {
            order.status = newStatus;
            order.updated_at = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.saveOrders(orders);

            // Broadcast multi-tab real-time event
            this.channel.postMessage({
                type: 'STATUS_UPDATE',
                token: token,
                status: newStatus,
                percentage: this.getStatusPercentage(newStatus)
            });
            return true;
        }
        return false;
    }

    getStatusPercentage(status) {
        const map = { 'PLACED': 25, 'PREPARING': 65, 'READY': 100, 'COLLECTED': 100 };
        return map[status] || 0;
    }

    onSyncEvent(callback) {
        this.channel.onmessage = (event) => {
            if (callback) callback(event.data);
        };
        // Fallback storage listener for cross-tab updates
        window.addEventListener('storage', (e) => {
            if (e.key === this.STORAGE_KEY && callback) {
                callback({ type: 'STORAGE_CHANGE' });
            }
        });
    }

    resetToDefaults() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.initDefaultData();
        this.channel.postMessage({ type: 'RESET_DEFAULTS' });
    }
}

window.TastyGoApp = new TastyGoApp();
