// Initialize Supabase client
const supabaseClient = window.supabase.createClient(
    'https://mjqcubvhzktcvajgfryq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qcWN1YnZoemt0Y3ZhamdmcnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyOTgzMDQsImV4cCI6MjA1Njg3NDMwNH0.sYzG29OoQ1wZ42LxyXKBUFI8q3kUcfIqA2oJVS8vy6c'
);

document.addEventListener('DOMContentLoaded', () => {
    // Test Supabase connection
    async function testConnection() {
        try {
            const { data, error } = await supabaseClient
                .from('orders')
                .select('*')
                .limit(1);
            
            if (error) {
                console.error('Supabase connection error:', error);
            } else {
                console.log('Supabase connected successfully!');
                console.log('Test query result:', data);
            }
        } catch (err) {
            console.error('Error testing connection:', err);
        }
    }

    testConnection();

    // Handle smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Handle order form submission
    const orderForm = document.getElementById('order-form');
    let cart = [];
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            order_date: new Date().toISOString(),
            status: 'pending',
            items: cart // Add the cart items to the order
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
            cart = []; // Clear the cart after successful order
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

            alert(`${productName} נוסף להזמנה!`);
            updateCartDisplay();
        });
    });

    // Add cart display functionality
    function updateCartDisplay() {
        const cartItems = {};
        const cartElement = document.getElementById('cart-display');
        
        if (!cartElement) return;

        if (cart.length === 0) {
            cartElement.innerHTML = '<div class="empty-cart">העגלה שלך ריקה</div>';
            return;
        }
        
        // Count quantities
        cart.forEach(item => {
            if (cartItems[item.name]) {
                cartItems[item.name].quantity++;
            } else {
                cartItems[item.name] = { ...item };
            }
        });

        // Update display
        cartElement.innerHTML = Object.values(cartItems)
            .map(item => `
                <div class="cart-item">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>${item.price}</span>
                </div>
            `).join('');
    }

    // Call updateCartDisplay initially
    updateCartDisplay();
});
