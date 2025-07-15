<picture>
  <source media="(prefers-color-scheme: light)" srcset="/.github/meta/dark.png">
  <source media="(prefers-color-scheme: dark)" srcset="/.github/meta/light.png">
  <img alt="SAVANA Project">
</picture>

# SAVANA - Environmental Monitoring Website

**Sustainable Action for the Village Environment, Education, and Health in Wonokitri**

A modern web application for monitoring environmental conditions in Wonokitri village, Bromo Tengger (Pasuruan Regency), East Java, as part of a community service program from July 3-31, 2025.

🌐 **Live Website:** [Deployed on Vercel](https://savanaui.vercel.app/)

## 📖 About

SAVANA is a comprehensive environmental monitoring website developed for the Wonokitri village community service program. The project focuses on collecting, storing, and visualizing real-time environmental data from sensors deployed throughout the village, helping residents and researchers understand local weather patterns and environmental conditions.

**Program Duration:** July 3, 2025 - July 31, 2025
**Location:** Wonokitri, Bromo Tengger, East Java, Indonesia
**Sponsored by:** BCA (Bank Central Asia) Bank
**Sensor Technology Partner:** Faculty of Mathematics and Natural Sciences, Universitas Indonesia

## ✨ Features

### 🌡️ Environmental Monitoring
- **Real-time Sensor Data**: Live temperature, humidity, pressure, soil moisture, and rainfall measurements
- **Historical Data Visualization**: Interactive charts showing environmental trends over time
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Data Persistence**: Automatic storage of sensor readings with Supabase integration

### 📊 Data Visualization
- **Interactive Charts**: Area charts with smooth animations using Recharts
- **Multiple Metrics**: Temperature, humidity, pressure, soil moisture, and rainfall tracking
- **Time-based Display**: Jakarta timezone-aware timestamps for accurate local time representation
- **Error Handling**: Graceful fallback to historical data when API is unavailable

### 🎨 User Experience
- **Immersive Landing Page**: Beautiful mountain imagery from Bromo Tengger region
- **Smooth Animations**: Parallax effects and smooth transitions between sections
- **Edelweiss Decorations**: Scattered alpine flower decorations representing local flora
- **Responsive Layout**: Mobile-first design with desktop enhancements

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling framework
- **Recharts** - Data visualization library
- **Radix UI** - Accessible component primitives

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **PostgreSQL** - Relational database for sensor data storage
- **Row Level Security** - Database security policies
- **Real-time subscriptions** - Live data updates

### Deployment
- **Vercel** - Frontend hosting and deployment
- **Environment Variables** - Secure configuration management
- **CORS Configuration** - Cross-origin resource sharing setup

## 🚀 Quick Start

### 📋 Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Git

### ⚙️ Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/savana.git
   cd savana
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file:
   ```bash
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=your_sensor_api_endpoint
   VITE_NODE_ID=your_sensor_node_id
   VITE_API_KEY=your_sensor_api_key
   ```

4. **Set up the database**
   Run the migration file in your Supabase SQL editor:
   ```bash
   # The migration file is located at:
   # supabase/migrations/001_create_sensor_data_table.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open [http://localhost:5173](http://localhost:5173) in your browser

## 📁 Project Structure

```
savana/
├── src/
│   ├── components/
│   │   ├── custom/
│   │   │   ├── sensor-chart.tsx    # Main data visualization component
│   │   │   └── squiggle.tsx        # Decorative SVG component
│   │   └── ui/                     # Reusable UI components
│   ├── lib/
│   │   └── supabase.ts             # Supabase client configuration
│   ├── assets/                     # Static images and media
│   └── App.tsx                     # Main application component
├── supabase/
│   └── migrations/
│       └── 001_create_sensor_data_table.sql
├── public/                         # Public static files
└── package.json
```

## 🔧 Configuration

### Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Sensor API Configuration
VITE_API_URL=https://your-sensor-api.com/data
VITE_NODE_ID=your-sensor-node-id
VITE_API_KEY=your-api-key
```

### Database Schema

The application uses a PostgreSQL table with the following structure:

```sql
CREATE TABLE sensor_data (
    id_node TEXT NOT NULL,
    waktu TEXT NOT NULL,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    pressure DECIMAL(7,2),
    moisture DECIMAL(5,2),
    rain DECIMAL(6,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id_node, waktu)
);
```

## 📊 Data Sources

### Sensor Data
- **Temperature**: Air temperature in Celsius (°C)
- **Humidity**: Relative humidity percentage (%)
- **Pressure**: Atmospheric pressure in hectopascals (hPa)
- **Soil Moisture**: Soil moisture percentage (%)
- **Rainfall**: Precipitation in millimeters (mm)

### Data Collection
- **Frequency**: Hourly data collection and storage
- **Storage**: Automatic upsert to prevent duplicates
- **Backup**: Historical data preserved for analysis
- **Timezone**: All timestamps converted to Asia/Jakarta timezone
- **Sensor Provider**: Faculty of Mathematics and Natural Sciences, Universitas Indonesia

## 🌍 Community Impact

### Environmental Awareness
- **Data Accessibility**: Making environmental data accessible to local community
- **Education**: Helping residents understand local weather patterns
- **Research**: Supporting environmental research in the Bromo Tengger region

### Technical Contribution
- **Open Source**: Contributing to environmental monitoring solutions
- **Documentation**: Comprehensive setup and usage documentation
- **Sustainability**: Long-term data preservation and analysis capabilities

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel
   ```

2. **Configure Environment Variables**
   Add all required environment variables in your Vercel dashboard

3. **Set up Custom Domain** (optional)
   Configure your custom domain in Vercel settings

### Supabase Setup

1. **Create a new Supabase project**
2. **Run the migration script** in the SQL editor
3. **Configure Row Level Security** policies as needed
4. **Set up real-time subscriptions** for live data updates

## 🙏 Acknowledgments

- **BCA (Bank Central Asia) Bank** for sponsoring the SAVANA project and supporting environmental monitoring initiatives
- **Faculty of Mathematics and Natural Sciences, Universitas Indonesia** for providing the environmental sensors and technical expertise
- **Wonokitri Village Community** for their support and participation
- **Bromo Tengger Semeru National Park** for environmental data collaboration
- **Local Environmental Research Groups** for scientific guidance
- **Community Service Program Coordinators** for project facilitation

## ⚖️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Project Goals

- **Environmental Monitoring**: Provide real-time environmental data to the community
- **Education**: Increase environmental awareness through data visualization
- **Research**: Support ongoing environmental research in the region
- **Sustainability**: Create a lasting impact beyond the one-month program period
- **Community Empowerment**: Enable data-driven decision making for local environmental initiatives

---

*This project is part of the community service program in Wonokitri village, sponsored by BCA Bank and supported by the Faculty of Mathematics and Natural Sciences Universitas Indonesia, contributing to sustainable environmental monitoring and community development in the Bromo Tengger region.*
