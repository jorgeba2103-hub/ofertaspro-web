document.addEventListener('DOMContentLoaded', () => {
    const productsGrid = document.getElementById('products-grid');
    const categoryFilter = document.getElementById('category-filter');
    const categoryList = document.getElementById('category-list');
    const priceFilter = document.getElementById('price-filter');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const sortFilter = document.getElementById('sort-filter');
    const resetFiltersBtn = document.querySelector('.reset-filters');

    let allProducts = [];
    let currentCategory = 'all';

    // Cargar datos
    fetch('../web_products.json')
        .then(response => {
            if(!response.ok) throw new Error("File not found");
            return response.json();
        })
        .then(data => {
            allProducts = data;
            
            if (productsGrid) {
                renderCategories(data);
                renderProducts(data);
                if (typeof renderHeroCarousel === 'function') renderHeroCarousel(data);
                
                // Eventos
                if(categoryFilter) categoryFilter.addEventListener('change', (e) => { currentCategory = e.target.value; applyFilters(); });
                if(priceFilter) priceFilter.addEventListener('change', applyFilters);
                if(searchInput) {
                    searchInput.addEventListener('input', applyFilters);
                    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') applyFilters(); });
                }
                if(searchBtn) searchBtn.addEventListener('click', applyFilters);
                if(sortFilter) sortFilter.addEventListener('change', applyFilters);
                if(resetFiltersBtn) {
                    resetFiltersBtn.addEventListener('click', () => {
                        if(searchInput) searchInput.value = '';
                        if(priceFilter) priceFilter.value = 'all';
                        if(sortFilter) sortFilter.value = 'recommended';
                        currentCategory = 'all';
                        if(categoryFilter) categoryFilter.value = 'all';
                        document.querySelectorAll('.cat-link').forEach(l => l.classList.remove('active'));
                        const allLink = document.querySelector('.cat-link[data-cat="all"]');
                        if(allLink) allLink.classList.add('active');
                        applyFilters();
                    });
                }
            }
        })
        .catch(err => {
            console.error('Error cargando productos:', err);
            if (productsGrid) {
                productsGrid.innerHTML = `
                <div class="glass-card" style="grid-column: 1/-1; text-align:center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size:40px; color:var(--brand-amazon); margin-bottom:16px;"></i>
                    <p>No se pudieron cargar los productos en este momento.</p>
                </div>`;
            }
        });

    function getStarsHTML(rating) {
        const r = Number(rating) || 0;
        const fullStars = Math.floor(r);
        const hasHalfStar = r % 1 >= 0.5 ? 1 : 0;
        const emptyStars = 5 - fullStars - hasHalfStar;
        
        let starsHTML = '';
        const activeColor = 'color: var(--brand-amazon); text-shadow: 0 0 5px rgba(245,158,11,0.5);';
        const mutedColor = 'color: rgba(255,255,255,0.1);';

        for(let i=0; i<fullStars; i++) starsHTML += `<i class="fa-solid fa-star" style="${activeColor}"></i>`;
        if(hasHalfStar) starsHTML += `<i class="fa-solid fa-star-half-stroke" style="${activeColor}"></i>`;
        for(let i=0; i<emptyStars; i++) starsHTML += `<i class="fa-solid fa-star" style="${mutedColor}"></i>`;
        
        return starsHTML;
    }

    function renderProducts(products) {
        productsGrid.innerHTML = '';
        if (products.length === 0) {
            productsGrid.innerHTML = `
            <div class="glass-card" style="grid-column: 1/-1; text-align:center; padding: 60px 40px;">
                <i class="fas fa-search" style="font-size:40px; color:var(--text-muted); margin-bottom:16px; opacity:0.5;"></i>
                <p style="color:var(--text-muted); font-size:16px;">No se encontraron resultados para tu búsqueda.</p>
            </div>`;
            return;
        }

        products.forEach((p, index) => {
            const card = document.createElement('div');
            card.className = 'product-card';
            // Simple cascada de animación
            card.style.animation = `fadeUp 0.5s ease forwards ${index * 0.05}s`;
            card.style.opacity = '0';
            
            const imgUrl = p.images && p.images.length > 0 ? p.images[0] : 'https://via.placeholder.com/300x300?text=No+Imagen';
            const ahorro = p.price > 50 ? "ENVÍO GRATIS" : "NUEVO";
            
            card.innerHTML = `
                <div class="img-container">
                    <div class="promo-badge">${ahorro}</div>
                    <img src="${imgUrl}" alt="${p.title.replace(/"/g, '&quot;')}" class="product-img" loading="lazy" onerror="this.closest('.product-card').remove();">
                </div>
                <div class="product-info">
                    <div class="product-brand">${p.category || 'Destacado'}</div>
                    <a href="${p.affiliate_link}" target="_blank" class="product-title" title="${p.title.replace(/"/g, '&quot;')}">${p.title}</a>
                    
                    <div class="product-rating">
                        <span class="stars">${getStarsHTML(p.rating)}</span>
                        <span class="reviews-count">(${p.reviews})</span>
                    </div>

                    <div class="price-container">
                        <div class="product-price">${p.price.toFixed(2)}€</div>
                        <div class="flexpay-text">Con Prime, lo tienes mañana.</div>
                    </div>
                    
                    <a href="${p.affiliate_link}" target="_blank" class="add-to-cart-btn">
                        <i class="fab fa-amazon" style="font-size:16px;"></i> VER EN AMAZON
                    </a>
                </div>
            `;
            productsGrid.appendChild(card);
        });
    }

    function renderCategories(products) {
        const categories = [...new Set(products.map(p => p.category))].filter(Boolean);
        
        // Render Navbar Select
        if(categoryFilter) {
            categoryFilter.innerHTML = '<option value="all">Todas las categorías</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                categoryFilter.appendChild(option);
            });
        }
        
        // Render Sidebar List
        if(categoryList) {
            categoryList.innerHTML = '<li><a href="#" data-cat="all" class="cat-link active">Todas</a></li>';
            categories.forEach(cat => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" data-cat="${cat}" class="cat-link">${cat}</a>`;
                categoryList.appendChild(li);
            });
            
            // Sidebar link events
            document.querySelectorAll('.cat-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.querySelectorAll('.cat-link').forEach(l => l.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    currentCategory = e.target.getAttribute('data-cat');
                    if(categoryFilter) categoryFilter.value = currentCategory;
                    applyFilters();
                });
            });
        }
    }

    function applyFilters() {
        const priceRange = priceFilter ? priceFilter.value : 'all';
        const search = searchInput ? searchInput.value.toLowerCase() : '';
        const sortMode = sortFilter ? sortFilter.value : 'recommended';

        let filtered = allProducts.filter(p => {
            // Filtro categoría
            const matchCat = currentCategory === 'all' || p.category === currentCategory;
            
            // Filtro búsqueda
            const matchSearch = p.title.toLowerCase().includes(search);
            
            // Filtro precio
            let matchPrice = true;
            if (priceRange !== 'all') {
                const [min, max] = priceRange.split('-').map(Number);
                if (max) {
                    matchPrice = p.price >= min && p.price <= max;
                } else {
                    matchPrice = p.price >= min;
                }
            }
            
            return matchCat && matchSearch && matchPrice;
        });

        // Ordenamiento
        if (sortMode === 'price-low') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortMode === 'price-high') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (sortMode === 'rating') {
            filtered.sort((a, b) => b.rating - a.rating);
        } else {
            // Un poco de aleatoriedad al inicio por "Recomendados" si quisieramos
        }

        renderProducts(filtered);
    }

    function renderHeroCarousel(products) {
        const carouselContainer = document.getElementById('hero-carousel');
        if (!carouselContainer) return;
        
        let top3 = [...products].sort((a,b) => b.reviews - a.reviews).slice(0, 3);
        if (top3.length === 0) {
            carouselContainer.innerHTML = '';
            return;
        }
        
        let slidesHTML = top3.map((p, index) => {
            const imgUrl = p.images && p.images.length > 0 ? p.images[0] : 'https://via.placeholder.com/300';
            const displayStyle = index === 0 ? 'opacity: 1; z-index: 2;' : 'opacity: 0; z-index: 1;';
            return `
                <div class="carousel-slide" style="${displayStyle}">
                    <div class="featured-tag">🔥 Top ${index + 1} Más Visto</div>
                    <div class="featured-img-wrap img-container" style="background: transparent; border: none; padding: 0;">
                        <img src="${imgUrl}" class="product-img" style="max-height: 220px; object-fit: contain;">
                    </div>
                    <div class="featured-info" style="margin-top: 20px;">
                        <h3 style="font-size: 20px; margin-bottom: 5px; line-height:1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color:white;">${p.title}</h3>
                        <p style="margin-bottom: 15px; color: var(--brand-accent); font-weight: bold; font-size:14px; text-transform:uppercase;">${p.category || 'Destacado'}</p>
                        <div class="featured-action">
                            <span class="fake-price" style="font-size: 28px;">${p.price.toFixed(2)}€</span>
                            <a href="${p.affiliate_link}" target="_blank" class="arrow-circle"><i class="fas fa-shopping-cart" style="font-size: 16px;"></i></a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        carouselContainer.innerHTML = slidesHTML;
        
        let currentIndex = 0;
        const slides = carouselContainer.querySelectorAll('.carousel-slide');
        if (slides.length <= 1) return;
        
        setInterval(() => {
            slides[currentIndex].style.opacity = '0';
            slides[currentIndex].style.zIndex = '1';
            
            currentIndex = (currentIndex + 1) % slides.length;
            
            slides[currentIndex].style.opacity = '1';
            slides[currentIndex].style.zIndex = '2';
        }, 4000);
    }
});

// Agregando animaciones CSS de cascada on the fly
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes fadeUp {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
}`;
document.head.appendChild(styleSheet);
