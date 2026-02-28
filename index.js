
import { supabase } from './subabase.js';
import { initAuthUI } from './auth.js';




document.addEventListener('DOMContentLoaded', () => {
    const profileContent = document.getElementById('profile-content')
    const profileInfo = document.getElementById('profile-info')
    const propertyList = document.getElementById('property-list');

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        const navContainer = nav.querySelector('div');

        if (window.scrollY > 50) {
            nav.classList.add('py-2');
            navContainer.classList.remove('rounded-2xl', 'max-w-7xl');
            navContainer.classList.add('rounded-none', 'max-w-full', 'border-transparent', 'bg-white/90');
        } else {
            nav.classList.remove('py-2');
            navContainer.classList.add('rounded-2xl', 'max-w-7xl');
            navContainer.classList.remove('rounded-none', 'max-w-full', 'border-transparent', 'bg-white/90');
        }
    });

    async function getUser() {
        const { data: { user } } = await supabase.auth.getUser()
        updateNavbar(user)
    }
    initAuthUI();


    async function getListings() {
        try {
            // Fetch from API and Supabase in parallel
            const apiPromise = fetch('/api/listings').then(res => res.ok ? res.json() : []);
            const supabasePromise = supabase
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            const [apiData, { data: supabaseData, error: sbError }] = await Promise.all([
                apiPromise,
                supabasePromise
            ]);

            if (sbError) console.error('Supabase fetch error:', sbError);

            // Normalize Supabase data to match the card display expectations
            const normalizedSb = (supabaseData || []).map(prop => ({
                id: prop.id,
                price: prop.price,
                offerType: prop.offer_type,
                realEstateType: prop.type || 'LUXURY_ESTATE',
                street: prop.street,
                city: prop.city,
                state: prop.state,
                bedrooms: prop.bedrooms,
                bathrooms: prop.bathrooms,
                livingArea: prop.sqft,
                pictures: [prop.image_url],
                url: '#',
                isSupabase: true
            }));

            // Combine data: new Supabase listings first, then default API listings
            const allListings = [...normalizedSb, ...apiData];

            if (allListings && allListings.length > 0) {
                displayListings(allListings);
            } else {
                propertyList.innerHTML = `<div class="col-span-full text-center py-10"><p class="text-gray-500 text-lg">No properties found at the moment.</p></div>`;
            }
        } catch (error) {
            console.error('Error fetching listings:', error);
            propertyList.innerHTML = `<div class="col-span-full text-center py-10"><p class="text-red-500 text-lg">Failed to load listings. Please try again later.</p></div>`;
        }
    }

    function displayListings(properties) {

        propertyList.innerHTML = '';

        properties.slice(0, 9).forEach((property, index) => {
            const listingUrl = property.url || '#';
            const cardProp = document.createElement('a');
            cardProp.href = listingUrl;
            cardProp.target = '_blank';

            const marginClass = index % 3 === 1 ? 'lg:mt-12' : (index % 3 === 2 ? 'lg:mt-24' : '');
            cardProp.className = `group bg-white rounded-[2rem] p-3 shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 overflow-hidden ${marginClass}`;

            const price = property.price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(property.price) : 'Price on Request';
            const status = property.offerType ? (property.offerType === 'sale' ? 'For Sale' : 'For Rent') : 'For Sale';
            const type = property.realEstateType ? property.realEstateType.replace('_', ' ') : 'PROPERTY';

            const addressParts = [property.street, property.city, property.state].filter(Boolean);
            const address = addressParts.length > 0 ? addressParts.join(', ') : 'Location not available';
            const city = property.city || 'Unknown City';
            const state = property.state || 'Unknown State';

            const beds = property.bedrooms || 0;
            const baths = property.bathrooms || 0;
            const sqft = property.livingArea ? new Intl.NumberFormat().format(property.livingArea) : 'N/A';

            // Collection of varied High-Resolution Fallback Images
            const fallbacks = [
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=1200&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1600566753190-17f0bcd2a6c4?q=80&w=1200&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1600572236304-f8a736f05141?q=80&w=1200&auto=format&fit=crop'
            ];

            const fallbackImage = fallbacks[index % fallbacks.length];


            let image = (property.pictures && property.pictures.length > 0) ? property.pictures[0] : fallbackImage;


            if (image.includes('zillowstatic.com')) {

            }

            cardProp.innerHTML = `
                <div class="relative h-64 rounded-[1.5rem] overflow-hidden mb-6 bg-gray-100">
                    <img src="${image}" alt="${address}" 
                         class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                         style="image-rendering: -webkit-optimize-contrast;"
                         onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1512918766674-ed62b9aed97a?q=80&w=1200&auto=format&fit=crop';">
                    <div class="absolute top-4 left-4 flex gap-2">
                        <span class="px-4 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-full shadow-lg">${status}</span>
                        <span class="px-4 py-1.5 bg-gray-900/40 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/20">${type}</span>
                    </div>
                    <div class="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-red-500 transition-all shadow-lg active:scale-90">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                </div>
                <div class="px-4 pb-4">
                    <div class="flex items-center gap-1 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-brand-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                        </svg>
                        <span class="text-sm text-gray-500">${address}</span>
                    </div>
                    <h4 class="text-xl font-bold text-gray-900 mb-4 group-hover:text-brand-600 transition-colors italic">${city}, ${state}</h4>
                    <p class="text-sm text-gray-400 mb-4 line-clamp-2">${description}</p>
                    <div class="flex items-center justify-between py-4 border-t border-gray-50 flex-wrap gap-4">
                        <div class="flex items-center gap-4 text-gray-500 text-sm">
                            <span class="flex items-center gap-1.5 font-medium"><span class="text-gray-900">${beds}</span> Beds</span>
                            <span class="flex items-center gap-1.5 font-medium"><span class="text-gray-900">${baths}</span> Baths</span>
                            <span class="flex items-center gap-1.5 font-medium"><span class="text-gray-900">${sqft}</span> sqft</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between mt-4">
                        <span class="text-2xl font-bold text-gray-900">${price}</span>
                        <div class="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white group-hover:bg-brand-600 transition-all shadow-md active:scale-95">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </div>
                    </div>
                </div>
            `;
            propertyList.appendChild(cardProp);
        });
    }

    getListings();


    initAuthUI();
    getListings();
});
