import { supabase } from "./subabase.js";

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');
    const mainContent = document.getElementById('dynamic-content');

    if (!propertyId) {
        if (mainContent) mainContent.innerHTML = '<div class="text-center py-20"><p class="text-red-500 font-bold text-xl">Property ID missing in URL.</p></div>';
        return;
    }

    async function fetchPropertyDetails() {
        try {
            const { data, error } = await supabase.from('properties').select('*').eq('id', propertyId).single();
            if (error) throw error;
            if (data) {
                renderPropertyPage(data);
            } else {
                if (mainContent) mainContent.innerHTML = '<div class="text-center py-20"><p class="text-gray-500 font-bold text-xl">Property not found.</p></div>';
            }
        } catch (err) {
            console.error("Error fetching property:", err);
            if (mainContent) mainContent.innerHTML = '<div class="text-center py-20"><p class="text-red-500 font-bold text-xl">Error loading property details.</p></div>';
        }
    }

    function renderPropertyPage(property) {
        if (!mainContent) return;

        const price = `$${(property.price || 0).toLocaleString()}`;
        const address = property.street || '';
        const city = property.city || '';
        const state = property.state || '';
        const beds = property.bedrooms || '-';
        const baths = property.bathrooms || '-';
        const sqft = property.sqft ? property.sqft.toLocaleString() : '-';
        const status = property.offer_type || 'For Sale';
        const type = property.type || 'Property';
        const title = property.title || `${type} in ${city}`;
        const description = property.description || 'No description available for this property.';
        const imageUrl = property.image_url || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2000';

        mainContent.innerHTML = `
            <div class="max-w-7xl mx-auto px-6">
                <!-- Breadcrumbs -->
                <nav class="flex text-sm text-gray-500 mb-6 gap-2 fade-in">
                    <a href="index.html" class="hover:text-brand-600 transition-colors">Home</a>
                    <span>/</span>
                    <a href="properties.html" class="hover:text-brand-600 transition-colors">Properties</a>
                    <span>/</span>
                    <span class="text-gray-900 font-medium truncate max-w-xs">${title}</span>
                </nav>

                <!-- Title Section -->
                <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 fade-in">
                    <div>
                        <div class="flex items-center gap-3 mb-3">
                            <span class="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm">${status}</span>
                            <span class="px-3 py-1 bg-white text-gray-700 rounded-full text-xs font-bold tracking-wide uppercase border border-gray-200 shadow-sm">${type}</span>
                        </div>
                        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-3">${title}</h1>
                        <div class="flex items-center gap-2 text-gray-500">
                            <i data-lucide="map-pin" class="w-5 h-5 text-brand-500"></i>
                            <p class="text-lg">${address}, ${city}, ${state}</p>
                        </div>
                    </div>
                    <div class="text-left md:text-right">
                        <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Asking Price</p>
                        <p class="text-4xl md:text-5xl font-bold text-brand-600 drop-shadow-sm">${price}</p>
                    </div>
                </div>

                <!-- Image Gallery -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12 h-[500px] fade-in" style="animation-delay: 0.1s;">
                    <div class="md:col-span-3 h-full rounded-3xl overflow-hidden relative group cursor-pointer shadow-lg shadow-gray-200/50">
                        <img src="${imageUrl}" alt="${title}" class="w-full h-full object-cover gallery-image" onerror="this.src='https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2000'">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent group-hover:opacity-80 transition-opacity"></div>
                        <button class="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md text-gray-900 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-white transition-all shadow-xl hover:scale-105 active:scale-95">
                            <i data-lucide="image" class="w-4 h-4"></i> View All Photos
                        </button>
                    </div>
                    <div class="hidden md:flex flex-col gap-4 h-full">
                        <div class="h-1/2 rounded-3xl overflow-hidden relative group cursor-pointer shadow-lg shadow-gray-200/50">
                            <img src="${imageUrl}" alt="Interior view" class="w-full h-full object-cover gallery-image opacity-80 hover:opacity-100 transition-opacity">
                        </div>
                        <div class="h-1/2 rounded-3xl overflow-hidden relative group cursor-pointer shadow-lg shadow-gray-200/50">
                            <img src="${imageUrl}" alt="Pool view" class="w-full h-full object-cover gallery-image opacity-80 hover:opacity-100 transition-opacity">
                            <div class="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors backdrop-blur-[2px]">
                                <span class="text-white font-bold text-xl tracking-wide">+12 more</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <!-- Main Details Column -->
                    <div class="lg:col-span-2 space-y-12 fade-in" style="animation-delay: 0.2s;">
                        <!-- Key Features Bar -->
                        <div class="flex flex-wrap items-center justify-between gap-6 p-6 bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100">
                            <div class="flex items-center gap-4">
                                <div class="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center shadow-inner">
                                    <i data-lucide="bed-double" class="w-7 h-7"></i>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500 font-medium">Bedrooms</p>
                                    <p class="text-2xl font-bold text-gray-900">${beds}</p>
                                </div>
                            </div>
                            <div class="w-px h-14 bg-gray-100 hidden sm:block"></div>
                            <div class="flex items-center gap-4">
                                <div class="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center shadow-inner">
                                    <i data-lucide="bath" class="w-7 h-7"></i>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500 font-medium">Bathrooms</p>
                                    <p class="text-2xl font-bold text-gray-900">${baths}</p>
                                </div>
                            </div>
                            <div class="w-px h-14 bg-gray-100 hidden sm:block"></div>
                            <div class="flex items-center gap-4">
                                <div class="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center shadow-inner">
                                    <i data-lucide="maximize" class="w-7 h-7"></i>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500 font-medium">Square Area</p>
                                    <p class="text-2xl font-bold text-gray-900">${sqft} <span class="text-base font-semibold text-gray-400">sq ft</span></p>
                                </div>
                            </div>
                        </div>

                        <!-- Description Segment -->
                        <section class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <i data-lucide="align-left" class="w-6 h-6 text-brand-500"></i> About this Property
                            </h2>
                            <div class="prose prose-lg text-gray-600 max-w-none leading-relaxed">
                                ${description.split('\n').map(p => `<p class="mb-5">${p}</p>`).join('')}
                            </div>
                        </section>

                        <!-- Amenities Segment -->
                        <section class="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <i data-lucide="sparkles" class="w-6 h-6 text-brand-500"></i> Amenities & Features
                            </h2>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                                ${['Infinity Pool', '4-Car Garage', 'Smart Security', 'Climate Control', 'Home Gym', 'Private Dock'].map(amenity => `
                                    <div class="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                                        <div class="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 shadow-sm">
                                            <i data-lucide="check-circle-2" class="w-5 h-5"></i>
                                        </div>
                                        <span class="font-semibold text-gray-700">${amenity}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </section>
                    </div>

                    <!-- Sidebar / Agent Contact Column -->
                    <div class="lg:col-span-1 fade-in" style="animation-delay: 0.3s;">
                        <div class="sticky top-32">
                            <div class="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
                                <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <i data-lucide="user" class="w-5 h-5 text-brand-500"></i> Contact Agent
                                </h3>
                                <div class="flex items-center gap-4 mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div class="relative w-16 h-16 rounded-full overflow-hidden shadow-md shrink-0">
                                        <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200" alt="Agent" class="w-full h-full object-cover">
                                    </div>
                                    <div>
                                        <p class="text-lg font-bold text-gray-900 leading-tight">Alexander Wright</p>
                                        <p class="text-brand-600 font-semibold text-sm">Luxury Property Specialist</p>
                                    </div>
                                </div>
                                <form class="space-y-4">
                                    <input type="text" placeholder="Your Name" class="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 outline-none bg-gray-50">
                                    <input type="email" placeholder="Your Email" class="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 outline-none bg-gray-50">
                                    <textarea placeholder="I am interested in this property..." rows="4" class="w-full px-5 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 outline-none bg-gray-50 resize-none"></textarea>
                                    <button type="button" class="w-full bg-brand-600 text-white py-4 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-xl shadow-brand-200 active:scale-95 flex items-center justify-center gap-2 text-lg">
                                        <i data-lucide="send" class="w-5 h-5"></i> Send Message
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Re-initialize Lucide icons for the new content
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // --- Authentication & Navbar Logic ---
    function updateNavbar(user) {
        const login = document.getElementById('login');
        const signup = document.getElementById('signup');
        const profile = document.getElementById('profile');
        const profileContent = document.getElementById('profile-content');

        if (user) {
            if (login) login.classList.add('hidden');
            if (signup) signup.classList.add('hidden');
            if (profile) profile.classList.remove('hidden');

            const firstName = user.user_metadata?.first_name || 'U';
            const lastName = user.user_metadata?.last_name || '';

            if (profileContent) {
                profileContent.innerHTML = `<span class="text-sm font-bold uppercase">${firstName[0]}${lastName[0] || ''}</span>`;
                if (user.user_metadata?.avatar_url) {
                    profileContent.innerHTML = `<img src="${user.user_metadata.avatar_url}" class="w-full h-full object-cover">`;
                }
            }
        } else {
            if (login) login.classList.remove('hidden');
            if (signup) signup.classList.remove('hidden');
            if (profile) profile.classList.add('hidden');
        }
    }

    async function getUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) updateNavbar(user);
    }

    const profileContent = document.getElementById('profile-content');
    const profileInfo = document.getElementById('profile-info');

    if (profileContent && profileInfo) {
        profileContent.addEventListener('click', () => {
            profileInfo.classList.toggle('hidden');
        });
    }

    async function getUserData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!userError && data && profileInfo) {
            profileInfo.innerHTML = `
                <div class="space-y-4">
                    <div class="border-b pb-3">
                        <p class="font-bold text-gray-900">${data.first_name} ${data.last_name}</p>
                        <p class="text-xs text-gray-500">${data.email}</p>
                        <p class="inline-block px-2 py-0.5 bg-brand-50 text-brand-600 text-[10px] font-bold rounded-md uppercase tracking-wider mt-1">${data.role}</p>
                    </div>
                    <div class="space-y-2">
                        <a href="agent.html" class="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600 transition-colors">
                            <i data-lucide="user" class="w-4 h-4"></i> Profile Settings
                        </a>
                        <button id="logout-btn" class="w-full text-left flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors">
                            <i data-lucide="log-out" class="w-4 h-4"></i> Logout
                        </button>
                    </div>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();

            const btn = document.getElementById('logout-btn');
            if (btn) btn.onclick = async () => {
                await supabase.auth.signOut();
                window.location.reload();
            };
        }
    }

    fetchPropertyDetails();
    getUser();
    getUserData();

    supabase.auth.onAuthStateChange((event, session) => {
        updateNavbar(session?.user);
        getUserData();
    });
});