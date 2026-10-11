// assets/js/components/maps.js
// Leaflet.js wrapper — Parent child tracking + Security campus map

(function () {
  'use strict';

  class KhensaniMap {
    constructor(elementId, opts = {}) {
      this.id = elementId;
      this.center = opts.center || [-26.2041, 28.0473]; // Johannesburg default
      this.zoom = opts.zoom || 15;
      this.map = null;
      this.markers = {};
      this.zones = [];
      this.unsubs = [];
    }

    init() {
      const el = document.getElementById(this.id);
      if (!el) return console.warn('[Map] element not found:', this.id);
      if (typeof L === 'undefined') return console.warn('[Map] Leaflet not loaded');

      this.map = L.map(this.id, {
        center: this.center,
        zoom: this.zoom,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        crossOrigin: true
      }).addTo(this.map);

      return this;
    }

    // ============ CAMPUS ZONES (safe zones from Firestore) ============
    async loadZones(schoolId) {
      const db = window.MindFlowFirebase?.db;
      if (!db) return;
      const snap = await db.collection('campus_zones')
        .where('schoolId', '==', schoolId).get();
      snap.forEach(doc => {
        const z = doc.data();
        if (!z.geojson) return;
        const layer = L.geoJSON(z.geojson, {
          style: {
            color: z.safeZone ? '#2A7A5E' : '#C8A450',
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.15
          }
        }).addTo(this.map);
        this.zones.push({ id: doc.id, layer, ...z });
      });
    }

    // ============ CHILD / OFFICER MARKERS (live updates) ============
    watchPositions(studentUids, { icon = 'child', onUpdate } = {}) {
      const db = window.MindFlowFirebase?.db;
      if (!db || !studentUids?.length) return;

      studentUids.forEach(uid => {
        const unsub = db.collection('locations_tracking')
          .where('studentId', '==', uid)
          .orderBy('timestamp', 'desc')
          .limit(1)
          .onSnapshot(snap => {
            if (snap.empty) return;
            const loc = snap.docs[0].data();
            const coords = loc.coordinates || loc.geoPoint;
            if (!coords) return;
            const latlng = [coords.latitude || coords.lat, coords.longitude || coords.lng];
            this.setMarker(uid, latlng, {
              label: loc.studentName || uid,
              status: loc.status || 'active',
              battery: loc.battery || null,
              icon
            });
            if (typeof onUpdate === 'function') onUpdate(uid, loc);
          });
        this.unsubs.push(unsub);
      });
    }

    setMarker(id, latlng, meta = {}) {
      const color = this.markerColor(meta.status, meta.icon);
      const html = `<div class="khensani-marker khensani-marker-${meta.icon || 'child'}"
                          style="--marker-color:${color}"></div>`;
      const icon = L.divIcon({ html, className: 'khensani-divicon', iconSize: [24, 24] });

      if (this.markers[id]) {
        this.markers[id].setLatLng(latlng);
      } else {
        this.markers[id] = L.marker(latlng, { icon }).addTo(this.map);
      }

      if (meta.label) {
        this.markers[id].bindPopup(
          `<strong>${meta.label}</strong>` +
          (meta.battery ? `<br/>Battery: ${meta.battery}%` : '') +
          (meta.status ? `<br/>Status: ${meta.status}` : '')
        );
      }
    }

    markerColor(status, icon) {
      if (icon === 'officer') return '#1565c0';
      if (status === 'alert') return '#b71c1c';
      if (status === 'idle') return '#c8a450';
      return '#2A7A5E';
    }

    fitAll() {
      if (!this.map) return;
      const coords = Object.values(this.markers).map(m => m.getLatLng());
      if (coords.length) this.map.fitBounds(L.latLngBounds(coords).pad(0.2));
    }

    destroy() {
      this.unsubs.forEach(u => typeof u === 'function' && u());
      if (this.map) this.map.remove();
    }
  }

  window.KhensaniMap = KhensaniMap;
})();