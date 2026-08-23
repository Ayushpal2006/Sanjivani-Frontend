import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, Building2, UserCheck, Navigation, Search, AlertCircle, RefreshCw, ExternalLink, Star } from 'lucide-react';

export default function CenterMapLocator({ lang }) {
  const [pincode, setPincode] = useState('110007');
  const [centersData, setCentersData] = useState(null);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapType, setMapType] = useState('roadmap');
  const [errorMsg, setErrorMsg] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Fetch initial North Delhi centers (110007)
  useEffect(() => {
    fetchLiveCenters('110007');
  }, []);

  // Initialize/Update Leaflet map WHEN centersData updates AND mapContainerRef is mounted
  useEffect(() => {
    if (!centersData || !mapContainerRef.current) return;

    const loadAndRenderMap = () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!window.L && !document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          renderMap(centersData);
        };
        document.head.appendChild(script);
      } else if (window.L) {
        renderMap(centersData);
      }
    };

    loadAndRenderMap();
  }, [centersData]);

  const fetchLiveCenters = async (pin) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/centers/live?pincode=${pin}`);
      const data = await res.json();
      
      if (data.success && data.centers && data.centers.length > 0) {
        const normalizedCenters = data.centers.map(c => ({
          ...c,
          latitude: Number(c.latitude || c.lat || 28.6980),
          longitude: Number(c.longitude || c.lng || 77.1925)
        }));

        const normalizedData = {
          ...data,
          lat: Number(data.lat || 28.6980),
          lng: Number(data.lng || 77.1925),
          centers: normalizedCenters
        };

        setCentersData(normalizedData);
        setSelectedCenter(normalizedCenters[0]);
      } else {
        setCentersData(null);
        setErrorMsg(data.error || 'Healthcare location service is temporarily unavailable.');
      }
    } catch (e) {
      console.error(e);
      setCentersData(null);
      setErrorMsg('Healthcare location service is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const renderMap = (data) => {
    if (!window.L || !mapContainerRef.current) return;
    const L = window.L;

    const mapLat = Number(data.lat) || 28.6980;
    const mapLng = Number(data.lng) || 77.1925;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [mapLat, mapLng],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        attribution: '&copy; Google Maps / OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([mapLat, mapLng], 13);
    }

    const map = mapInstanceRef.current;

    // Recalculate tile sizes to ensure map renders immediately
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    // Clear existing markers
    markersRef.current.forEach(m => {
      if (map.hasLayer(m)) map.removeLayer(m);
    });
    markersRef.current = [];

    const bounds = L.latLngBounds();

    data.centers.forEach((center) => {
      const isNearest = center.is_nearest;
      const cLat = Number(center.latitude) || 28.6980;
      const cLng = Number(center.longitude) || 77.1925;

      const iconHtml = `
        <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
          <div style="width:36px; height:36px; background:#dc2626; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; box-shadow:0 4px 10px rgba(0,0,0,0.3); border:2px solid #fff;">
            🏥
          </div>
          <div style="background:rgba(255,255,255,0.95); color:#0f172a; font-size:10px; font-weight:800; padding:2px 6px; border-radius:10px; margin-top:2px; border:1px solid #cbd5e1; white-space:nowrap; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
            ${center.name.replace('Ayushman Arogya Mandir — ', '')}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-pin',
        iconSize: [120, 55],
        iconAnchor: [60, 40],
        popupAnchor: [0, -40]
      });

      const marker = L.marker([cLat, cLng], { icon: customIcon }).addTo(map);

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; padding: 6px; min-width: 220px;">
          <div style="display:flex; align-items:center; gap:4px; margin-bottom:4px;">
            <span style="background:#dc2626; color:#ffffff; font-size:10px; font-weight:900; padding:2px 6px; border-radius:4px; text-transform:uppercase;">🏥 AYUSHMAN AROGYA MANDIR</span>
            ${isNearest ? '<span style="background:#f59e0b; color:#0f172a; font-size:10px; font-weight:900; padding:2px 6px; border-radius:4px; text-transform:uppercase;">⭐ NEAREST</span>' : ''}
          </div>
          <h4 style="margin:4px 0 2px 0; font-weight:800; font-size:14px; color:#0f172a;">${center.name}</h4>
          <p style="margin:0 0 6px 0; font-size:11px; color:#475569;">${center.address}</p>
          <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:700; color:#059669; margin-bottom:8px;">
            <span>📍 ${center.distance_km} km (North Delhi)</span>
            <span>⏱️ ${center.travel_time}</span>
          </div>
          <a href="${center.directions_url}" target="_blank" style="display:block; text-align:center; background:#1a73e8; color:#fff; padding:7px 12px; border-radius:8px; font-size:11px; font-weight:800; text-decoration:none; box-shadow:0 2px 4px rgba(0,0,0,0.1);">OPEN IN GOOGLE MAPS DIRECTIONS ➔</a>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedCenter(center);
      });

      markersRef.current.push(marker);
      bounds.extend([cLat, cLng]);
    });

    if (data.centers.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (pincode.trim()) {
      fetchLiveCenters(pincode.trim());
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Google Maps Styled Header Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        
        {/* Google Maps Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm p-1.5">
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <path fill="#4285F4" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path>
              <circle fill="#EA4335" cx="12" cy="9" r="2.5"></circle>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-lg">Google Maps</span>
              <span className="bg-blue-100 text-blue-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                North Delhi Region (Pincode 110007)
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {lang === 'hi'
                ? 'उत्तरी दिल्ली के सभी पंजीकृत आयुष्मान आरोग्य मंदिरों का गूगल मानचित्र'
                : 'Interactive Google Maps structure highlighting registered Ayushman Arogya Mandirs in North Delhi.'}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-300">
          <div className="flex items-center gap-2 px-3">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Pincode (e.g. 110007)"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-900 focus:outline-none w-44 font-mono uppercase placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>SEARCH</span>
          </button>
        </form>

      </div>

      {/* ERROR DISPLAY */}
      {errorMsg && !loading && (
        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-3xl text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-red-700 font-extrabold text-base">
            <AlertCircle className="w-6 h-6" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => fetchLiveCenters('110007')}
            className="px-5 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition"
          >
            Reset to North Delhi (110007)
          </button>
        </div>
      )}

      {/* MAIN MAP & CENTER CARDS GRID */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column: Google Maps Interactive Tile Engine & Google Embed */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-3 shadow-xl border border-slate-200 flex flex-col justify-between relative overflow-hidden">
          
          {/* Header Controls Overlay */}
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                <span>North Delhi Ayushman Arogya Mandirs ({centersData ? centersData.total : 6})</span>
              </span>
            </div>
            <div className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              Interactive Google Maps View
            </div>
          </div>

          {/* Leaflet Map Canvas Div (Always mounted in DOM) */}
          <div
            ref={mapContainerRef}
            className="w-full h-[480px] rounded-2xl shadow-inner relative z-10 border border-slate-200"
            style={{ minHeight: '480px', background: '#f1f5f9' }}
          ></div>

          {/* Fallback Google Maps Direct Embed Iframe */}
          <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 shadow">
            <iframe
              title="Google Maps North Delhi Ayushman Centers"
              width="100%"
              height="220"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3499.7891234567!2d77.1925!3d28.6980!2m3!100!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd123456789%3A0x123456789!2sModel%20Town%20North%20Delhi!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin"
            ></iframe>
          </div>

          {/* Selected Center Summary Bar */}
          {selectedCenter && (
            <div className="p-4 bg-slate-900 text-white rounded-2xl mt-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                    Ayushman Arogya Mandir
                  </span>
                  {selectedCenter.is_nearest && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-slate-950" /> NEAREST CENTRE
                    </span>
                  )}
                </div>
                <h4 className="text-base font-extrabold mt-1">{selectedCenter.name}</h4>
                <div className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <span>{selectedCenter.address}</span>
                </div>
              </div>

              <a
                href={selectedCenter.directions_url}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>OPEN IN GOOGLE MAPS DIRECTIONS</span>
              </a>
            </div>
          )}
        </div>

        {/* Right Column: Verified North Delhi Centers List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-red-600" />
              <span>North Delhi Centers</span>
            </h3>
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              Pincode: 110007
            </span>
          </div>

          {centersData && centersData.centers && (
            <div className="space-y-3 max-h-[740px] overflow-y-auto pr-1">
              {centersData.centers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCenter(c);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.setView([c.latitude, c.longitude], 15);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    c.is_nearest
                      ? 'bg-amber-50/90 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                      : selectedCenter?.id === c.id
                      ? 'bg-blue-50 border-blue-500 shadow-md'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-100 text-red-700 inline-block mb-1 border border-red-200">
                        🏥 Ayushman Arogya Mandir
                      </span>
                      {c.is_nearest && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950 inline-block ml-1">
                          ⭐ NEAREST
                        </span>
                      )}
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">{c.name}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-blue-800 bg-blue-100 px-2 py-1 rounded-lg block">
                        {c.distance_km} km
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{c.travel_time}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 flex items-center gap-1 mb-3">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                    <span className="truncate">{c.address}</span>
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-900 text-[11px]">{c.assigned_asha_name}</span>
                    </div>

                    <a
                      href={c.directions_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 font-extrabold hover:underline text-[11px] flex items-center gap-1"
                    >
                      <span>Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
