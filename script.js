// Initialize Supabase client
const supabaseClient = window.supabase.createClient(
    'https://mjqcubvhzktcvajgfryq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qcWN1YnZoemt0Y3ZhamdmcnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyOTgzMDQsImV4cCI6MjA1Njg3NDMwNH0.sYzG29OoQ1wZ42LxyXKBUFI8q3kUcfIqA2oJVS8vy6c'
);

document.addEventListener('DOMContentLoaded', () => {
    let cart = [];
    const specialOffers = {
        'buy2get1': {
            condition: (items) => {
                // Check if there are 3 or more items of the same type
                const quantities = {};
                items.forEach(item => {
                    quantities[item.name] = (quantities[item.name] || 0) + 1;
                });
                return Object.values(quantities).some(qty => qty >= 3);
            },
            message: 'מבצע: קנה 2 קבל 1 חינם!',
            apply: (items) => {
                const quantities = {};
                items.forEach(item => {
                    quantities[item.name] = (quantities[item.name] || 0) + 1;
                });
                
                let discount = 0;
                Object.entries(quantities).forEach(([name, qty]) => {
                    if (qty >= 3) {
                        const freeItems = Math.floor(qty / 3);
                        const price = parseFloat(items.find(item => item.name === name).price.replace('₪', ''));
                        discount += freeItems * price;
                    }
                });
                return discount;
            }
        }
    };

    // Handle order form submission
    const orderForm = document.getElementById('order-form');
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (cart.length === 0) {
            alert('העגלה ריקה! אנא הוסף פריטים לפני שליחת ההזמנה.');
            return;
        }

        // Get form data
        const formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            order_date: new Date().toISOString(),
            status: 'pending',
            items: cart
        };

        console.log('Attempting to submit order:', formData);

        try {
            // Insert order into Supabase
            const { data, error } = await supabaseClient
                .from('orders')
                .insert([formData]);

            if (error) {
                console.error('Error submitting order:', error);
                throw error;
            }

            console.log('Order submitted successfully:', data);
            alert('תודה על הזמנתך! ניצור איתך קשר בקרוב');
            orderForm.reset();
            cart = [];
            updateCartDisplay();
        } catch (error) {
            console.error('Error:', error);
            alert('אירעה שגיאה בשליחת ההזמנה. אנא נסה שוב מאוחר יותר.');
        }
    });

    // Add to cart functionality
    const orderButtons = document.querySelectorAll('.order-button');
    orderButtons.forEach(button => {
        button.addEventListener('click', () => {
            const product = button.parentElement;
            const productName = product.querySelector('h3').textContent;
            const productPrice = product.querySelector('p').textContent;
            
            cart.push({
                name: productName,
                price: productPrice,
                quantity: 1
            });

            updateCartDisplay();
        });
    });

    // Cart functionality
    function updateQuantity(index, delta) {
        if (cart[index]) {
            if (delta === -1 && cart[index].quantity === 1) {
                cart.splice(index, 1);
            } else {
                cart[index].quantity += delta;
            }
            updateCartDisplay();
        }
    }

    function deleteItem(index) {
        cart.splice(index, 1);
        updateCartDisplay();
    }

    function calculateTotal(items) {
        return items.reduce((total, item) => {
            const price = parseFloat(item.price.replace('₪', ''));
            return total + (price * item.quantity);
        }, 0);
    }

    function checkSpecialOffers(items) {
        const activeOffers = [];
        let totalDiscount = 0;

        for (const [key, offer] of Object.entries(specialOffers)) {
            if (offer.condition(items)) {
                activeOffers.push(offer.message);
                totalDiscount += offer.apply(items);
            }
        }

        return { activeOffers, totalDiscount };
    }

    // Add cart display functionality
    function updateCartDisplay() {
        const cartElement = document.getElementById('cart-display');
        const cartSummary = document.getElementById('cart-summary');
        const specialOffersElement = document.getElementById('special-offers');
        
        if (!cartElement || !cartSummary || !specialOffersElement) return;

        if (cart.length === 0) {
            cartElement.innerHTML = '<div class="empty-cart">העגלה שלך ריקה</div>';
            cartSummary.style.display = 'none';
            return;
        }

        cartSummary.style.display = 'block';

        // Group items by name and sum quantities
        const groupedItems = cart.reduce((acc, item) => {
            if (!acc[item.name]) {
                acc[item.name] = { ...item };
            } else {
                acc[item.name].quantity++;
            }
            return acc;
        }, {});

        // Display cart items
        cartElement.innerHTML = Object.values(groupedItems)
            .map((item, index) => `
                <div class="cart-item">
                    <div class="cart-item-details">
                        <span class="cart-item-name">${item.name}</span>
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                        </div>
                    </div>
                    <div class="cart-item-actions">
                        <span>${item.price}</span>
                        <button class="delete-item" onclick="deleteItem(${index})">🗑️</button>
                    </div>
                </div>
            `).join('');

        // Check for special offers
        const { activeOffers, totalDiscount } = checkSpecialOffers(cart);
        
        // Display special offers
        specialOffersElement.innerHTML = activeOffers.length > 0 
            ? activeOffers.map(offer => `<div class="special-offer">${offer}</div>`).join('')
            : '';

        // Calculate and display total
        const subtotal = calculateTotal(cart);
        const total = subtotal - totalDiscount;
        document.getElementById('cart-total-amount').textContent = `₪${total.toFixed(2)}`;
    }

    // Make functions available globally
    window.updateQuantity = updateQuantity;
    window.deleteItem = deleteItem;

    // Call updateCartDisplay initially
    updateCartDisplay();
});
