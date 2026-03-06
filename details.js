import { supabase } from "./subabase.js";
import { initAuthUI } from "./auth.js";

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
                // Fetch agent profile details
                let agentData = null;
                if (data.agent_id) {
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('first_name, last_name, profile_url, role')
                        .eq('id', data.agent_id)
                        .maybeSingle();

                    if (!profileError) {
                        agentData = profile;
                    }
                }

                renderPropertyPage(data, agentData);
            } else {
                if (mainContent) mainContent.innerHTML = '<div class="text-center py-20"><p class="text-gray-500 font-bold text-xl">Property not found.</p></div>';
            }
        } catch (err) {
            console.error("Error fetching property:", err);
            if (mainContent) mainContent.innerHTML = '<div class="text-center py-20"><p class="text-red-500 font-bold text-xl">Error loading property details.</p></div>';
        }


    }

    function renderPropertyPage(property, agent = null) {
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
  <nav class="flex text-sm text-gray-400 mb-6 mt-4 gap-2 fade-in">
    <a href="index.html" class="hover:text-brand-600 transition-colors">Home</a>
    <span>/</span>
    <a href="properties.html" class="hover:text-brand-600 transition-colors">Properties</a>
    <span>/</span>
    <span class="text-gray-900 font-semibold truncate max-w-[200px] md:max-w-md">
      ${title}
    </span>
  </nav>

  <!-- Header -->
  <div class="grid grid-cols-1 lg:grid-cols-4 items-start gap-6 mb-8 fade-in">

    <div class="lg:col-span-3 space-y-3">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="px-2.5 py-0.5 bg-brand-600 text-white rounded-md text-[9px] font-black tracking-widest uppercase">
          ${status}
        </span>
        <span class="px-2.5 py-0.5 bg-white text-gray-900 rounded-md text-[9px] font-black tracking-widest uppercase border">
          ${type}
        </span>
      </div>

      <h1 class="text-3xl md:text-5xl font-bold text-gray-900 break-words leading-tight">
        ${title}
      </h1>

      <div class="flex items-center gap-2 text-gray-500">
        <i data-lucide="map-pin" class="w-4 h-4 text-brand-500"></i>
        <p class="text-lg font-medium">
          ${address}, ${city}, ${state}
        </p>
      </div>
    </div>

    <div class="text-left lg:text-right bg-white p-5 rounded-3xl border shadow-xl">
      <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
        Asking Price
      </p>
      <p class="text-3xl md:text-4xl font-bold text-gray-900">
        ${price}
      </p>
    </div>

  </div>

  <!-- Gallery -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12 fade-in">

    <!-- Main Image -->
    <div class="md:col-span-3 rounded-[2.5rem] overflow-hidden relative group shadow-2xl">
      <img
        src="${imageUrl}"
        alt="${title}"
        class="w-full h-[420px] md:h-[520px] object-cover transition-transform duration-700 group-hover:scale-105"
        onerror="this.src='https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2000'"
      />

      <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

      <div class="absolute bottom-6 left-6">
        <button class="bg-white/95 backdrop-blur-md text-gray-900 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl">
          <i data-lucide="maximize-2" class="w-3.5 h-3.5 text-brand-600"></i>
          Full Gallery
        </button>
      </div>
    </div>

    <!-- Side Thumbnails -->
    <div class="hidden md:flex flex-col gap-4">

      <div class="h-[250px] rounded-[2rem] overflow-hidden shadow-lg">
        <img
          src="${imageUrl}"
          class="w-full h-full object-cover opacity-90 hover:opacity-100 transition cursor-pointer"
        />
      </div>

      <div class="h-[250px] rounded-[2rem] overflow-hidden relative group shadow-lg cursor-pointer">
        <img
          src="${imageUrl}"
          class="w-full h-full object-cover opacity-90 hover:opacity-100 transition"
        />
        <div class="absolute inset-0 bg-gray-900/40 flex items-center justify-center backdrop-blur-[2px]">
          <span class="text-white font-black text-xl">+12</span>
        </div>
      </div>

    </div>

  </div>

  <!-- Main Content -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">

    <!-- Left Column -->
    <div class="lg:col-span-2 space-y-8 fade-in">

      <!-- Features Bar -->
      <div class="grid grid-cols-3 gap-3 p-3 bg-white rounded-[2rem] shadow-xl border">

        <div class="flex flex-col items-center justify-center p-4 bg-brand-50 rounded-2xl">
          <span class="text-xl font-black">${beds}</span>
          <span class="text-[9px] font-bold uppercase tracking-widest text-brand-600">Beds</span>
        </div>

        <div class="flex flex-col items-center justify-center p-4 bg-orange-50 rounded-2xl">
          <span class="text-xl font-black">${baths}</span>
          <span class="text-[9px] font-bold uppercase tracking-widest text-orange-600">Baths</span>
        </div>

        <div class="flex flex-col items-center justify-center p-4 bg-emerald-50 rounded-2xl">
          <span class="text-xl font-black">${sqft}</span>
          <span class="text-[9px] font-bold uppercase tracking-widest text-emerald-600">Sq Ft</span>
        </div>

      </div>

      <!-- Description -->
      <div class="bg-white p-8 rounded-[2.5rem] shadow-lg border space-y-8">

        <div>
          <h2 class="text-2xl font-bold mb-5 flex items-center gap-3">
            <span class="w-1 h-6 bg-brand-600 rounded-full"></span>
            Property Highlights
          </h2>

          <div class="text-gray-600 leading-relaxed">
            ${
              description
                .split('\n')
                .map(p => p.trim() ? `<p class="mb-4">${p}</p>` : '')
                .join('')
            }
          </div>
        </div>

        <div class="h-px bg-gray-100"></div>

        <!-- Amenities -->
        <div>
          <h3 class="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">
            Top Amenities
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${['Smart Integration','Private Balcony','Climate Control','Home Cinema','Gourmet Kitchen','Concierge']
              .map(amenity => `
                <div class="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border hover:bg-white transition">
                  <i data-lucide="check-circle-2" class="w-5 h-5 text-brand-600"></i>
                  <span class="font-bold text-xs tracking-tight">${amenity}</span>
                </div>
              `).join('')
            }
          </div>

        </div>

      </div>

    </div>

    <!-- Sidebar -->
    <div class="lg:sticky lg:top-28 space-y-4">

      <!-- Agent Card -->
      <div class="bg-gray-900 rounded-[2.5rem] p-6 text-white shadow-2xl relative">

        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 rounded-2xl overflow-hidden border">
            <img
              src="${agent?.profile_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'}"
              class="w-full h-full object-cover"
              onerror="this.src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'"
            />
          </div>

          <div>
            <h4 class="text-lg font-black">
              ${agent ? `${agent.first_name} ${agent.last_name}` : 'Luxe Specialist'}
            </h4>

            <p class="text-[8px] uppercase tracking-widest text-emerald-400 mt-1">
              Available Now
            </p>
          </div>
        </div>

        <form id="agent-contact-form" data-agent-id="${property.agent_id || ''}" class="space-y-3">

          <input type="text" placeholder="Full Name"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-brand-500 outline-none"
            required>

          <input type="email" placeholder="Email Address"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-brand-500 outline-none"
            required>

          <textarea rows="3" placeholder="I'm interested in this..."
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs resize-none focus:border-brand-500 outline-none"
            required></textarea>

          <button class="w-full bg-brand-600 hover:bg-brand-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2">
            Contact Expert
          </button>

        </form>

      </div>

    </div>

  </div>

</div>
        `;

        // Handle Contact Form Submission

        // Re-initialize Lucide icons for the new content
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // --- Navbar Effects & Logic ---
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        const navContainer = nav.querySelector('div');

        if (window.scrollY > 50) {
            nav.classList.add('py-2');
            if (navContainer) {
                navContainer.classList.remove('rounded-2xl', 'max-w-7xl');
                navContainer.classList.add('rounded-none', 'max-w-full', 'border-transparent', 'bg-white/90');
            }
        } else {
            nav.classList.remove('py-2');
            if (navContainer) {
                navContainer.classList.add('rounded-2xl', 'max-w-7xl');
                navContainer.classList.remove('rounded-none', 'max-w-full', 'border-transparent', 'bg-white/90');
            }
        }
    });

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.onclick = () => {
            mobileMenu.classList.toggle('opacity-0');
            mobileMenu.classList.toggle('translate-y-[-10px]');
            mobileMenu.classList.toggle('pointer-events-none');
            mobileMenu.classList.toggle('opacity-100');
            mobileMenu.classList.toggle('translate-y-0');
            mobileMenu.classList.toggle('pointer-events-auto');
        };
    }





    // --- Authentication & Navbar Logic ---
    fetchPropertyDetails();
    initAuthUI();
});
