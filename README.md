# India2World — Frontend Website

Shop in India. Deliver Worldwide.

A modern, responsive, frontend-only application for the **India2World** cross-border shopping and logistics platform, built to the exact specifications of the 4 provided reference designs.

---

## 🚀 Quick Start (Localhost Deployment)

### 1. Run the Development Server
```bash
npm.cmd run dev
```
The server will start at:
* **Local:** `http://localhost:5173/`
* **Network:** `http://<your-local-ip>:5173/`

### 2. Build for Production
```bash
npm.cmd run build
```

### 3. Preview Production Build
```bash
npm.cmd run preview
```

---

## 🎨 Implemented Reference Designs

1. **Sign Up / Login** (`/` or switch to Sign Up)
   * Authentic backdrop with India Gate, Taj Mahal, airplane in sky, and branded parcel boxes
   * Segmented toggle between `[Sign Up]` and `[Login]`
   * Social OAuth buttons (Google, Email)
   * Country dial code selector (`+91`, `+971`, `+1`, etc.)
   * Country of residence picker
   * Password visibility toggle
   * Terms checkbox with frontend validation

2. **Homepage**
   * Top navigation with branding, links, and currency selector
   * Hero section with *"From India to Your Doorstep"* badge and product link input with *"Get Started →"*
   * 3 value checkmarks
   * Authentic 3D shipping illustration
   * Top Indian stores: Amazon.in, Myntra, Flipkart, TATA CLiQ, AJIO, NYKAA, BigBasket
   * 6-step *"How It Works"* flow with connecting arrows
   * Popular categories grid (Fashion, Electronics, Home & Living, Beauty, Books, Wellness)

3. **Buy For Me — New Request**
   * 5-step workflow stepper (*Add Products* → *Review & Submit* → *Admin Review* → *Get Quote* → *Make Payment*)
   * Preloaded sample items: Nike Running Shoes, Women's Kurta Set, Atomic Habits
   * Quantity, size, color selectors with real-time price & subtotal calculations
   * Manual product entry modal
   * Packaging preferences and simulated quotation / checkout

4. **Customer Dashboard**
   * 12-item sidebar navigation
   * Customer welcome header (John Doe `CUS-10028`) with notifications counter
   * 7 colored statistic cards matching exact metrics
   * Recent Activity timeline
   * Interactive *Track Your Shipment* modal
   * *Get Your Indian Address* modal with copyable locker details

---

## 🛠️ Tech Stack

* **Framework:** React 19 + TypeScript + Vite 8
* **Styling:** Tailwind CSS v4
* **Icons:** Lucide React
* **Typography:** Plus Jakarta Sans & Inter
