import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { supabase, type SensorDataRow } from '@/lib/supabase';

interface SensorData {
  id_node: string;
  waktu: string;
  data_node: {
    rh: number;
    mous: number;
    rain: number;
    temp: number;
    press: number;
  };
}

interface ApiResponse {
  data: SensorData;
  status: string;
}

interface ChartDataPoint {
  time: string;
  value: number;
  timestamp: number;
}

const chartConfigs = {
  temperature: {
    label: "Suhu",
    color: "var(--chart-1)",
    unit: "°C",
  },
  humidity: {
    label: "Kelembapan",
    color: "var(--chart-2)",
    unit: "%",
  },
  pressure: {
    label: "Tekanan",
    color: "var(--chart-3)",
    unit: "hPa",
  },
  moisture: {
    label: "Kelembapan Tanah",
    color: "var(--chart-4)",
    unit: "%",
  },
  rain: {
    label: "Curah Hujan",
    color: "var(--chart-5)",
    unit: "mm",
  },
};

export default function SensorChart() {
  const [apiData, setApiData] = useState<SensorData | null>(null);
  const [historicalData, setHistoricalData] = useState<{
    temperature: ChartDataPoint[];
    humidity: ChartDataPoint[];
    pressure: ChartDataPoint[];
    moisture: ChartDataPoint[];
    rain: ChartDataPoint[];
  }>({
    temperature: [],
    humidity: [],
    pressure: [],
    moisture: [],
    rain: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoricalData = async () => {
    try {
      const { data, error } = await supabase
        .from('sensor_data')
        .select('*')
        .order('waktu', { ascending: true })

      if (error) {
        console.error('Error fetching historical data:', error);
        return;
      }

      if (data) {
        const processedData = {
          temperature: data.map((item: SensorDataRow) => {
            const utcDate = new Date(item.waktu + 'Z'); // Explicitly mark as UTC
            return {
              time: utcDate.toLocaleString('id-ID', { 
                timeZone: 'Asia/Jakarta',
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
              }),
              value: item.temperature || 0,
              timestamp: utcDate.getTime(),
            };
          }),
          humidity: data.map((item: SensorDataRow) => {
            const utcDate = new Date(item.waktu + 'Z');
            return {
              time: utcDate.toLocaleString('id-ID', { 
                timeZone: 'Asia/Jakarta',
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
              }),
              value: item.humidity || 0,
              timestamp: utcDate.getTime(),
            };
          }),
          pressure: data.map((item: SensorDataRow) => {
            const utcDate = new Date(item.waktu + 'Z');
            return {
              time: utcDate.toLocaleString('id-ID', { 
                timeZone: 'Asia/Jakarta',
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
              }),
              value: item.pressure || 0,
              timestamp: utcDate.getTime(),
            };
          }),
          moisture: data.map((item: SensorDataRow) => {
            const utcDate = new Date(item.waktu + 'Z');
            return {
              time: utcDate.toLocaleString('id-ID', { 
                timeZone: 'Asia/Jakarta',
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
              }),
              value: item.moisture || 0,
              timestamp: utcDate.getTime(),
            };
          }),
          rain: data.map((item: SensorDataRow) => {
            const utcDate = new Date(item.waktu + 'Z');
            return {
              time: utcDate.toLocaleString('id-ID', { 
                timeZone: 'Asia/Jakarta',
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
              }),
              value: item.rain || 0,
              timestamp: utcDate.getTime(),
            };
          }),
        };

        setHistoricalData(processedData);
      }
    } catch (err) {
      console.error('Error fetching historical data:', err);
    }
  };

  const storeSensorData = async (sensorData: SensorData) => {
    try {
      const dataToStore: SensorDataRow = {
        id_node: sensorData.id_node,
        waktu: sensorData.waktu,
        temperature: sensorData.data_node.temp,
        humidity: sensorData.data_node.rh,
        pressure: sensorData.data_node.press,
        moisture: sensorData.data_node.mous,
        rain: sensorData.data_node.rain,
      };

      const { error } = await supabase
        .from('sensor_data')
        .upsert([dataToStore], {
          onConflict: 'id_node,waktu',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error storing sensor data:', error);
      } else {
        console.log('Sensor data stored/updated successfully');
        await fetchHistoricalData();
      }
    } catch (err) {
      console.error('Error storing sensor data:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchHistoricalData();

        const apiUrl = `${import.meta.env.VITE_API_URL}?id_node=${import.meta.env.VITE_NODE_ID}&api_key=${import.meta.env.VITE_API_KEY}`;

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: ApiResponse = await response.json();

        if (result.status !== 'Ok') {
          throw new Error(`API error: ${result.status}`);
        }

        setApiData(result.data);
        await storeSensorData(result.data);
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        await fetchHistoricalData();

        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
          setError('Network error: Unable to connect to the API. Showing historical data only.');
        } else {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, []);

  const renderChart = (dataKey: keyof typeof chartConfigs, data: ChartDataPoint[]) => {
    const config = chartConfigs[dataKey];

    return (
      <Card key={dataKey} className="w-full">
        <CardHeader>
          <CardTitle>{config.label} ({config.unit})</CardTitle>
          <CardDescription>
            {data.length > 0 ? `${data.length} titik data` : 'Tidak ada data tersedia'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ [dataKey]: config }}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    labelFormatter={(label: string) => label}
                    indicator="dot"
                    nameKey="value"
                    formatter={(value) => [value, config.unit]}
                  />
                }
              />
              <Area
                dataKey="value"
                type="natural"
                fill={`var(--color-${dataKey})`}
                stroke={`var(--color-${dataKey})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Memuat Data Sensor...</CardTitle>
            <CardDescription>Mengambil data lingkungan...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Data Cuaca Wonokitri</h1>
        <div className="text-base mt-1">
          {apiData ? (
            <>
              Node: {apiData.id_node} | Last Updated: {new Date(apiData.waktu + 'Z').toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
            </>
          ) : (
            'Historical data view'
          )}
        </div>
        {error && (
          <div className="text-amber-600 text-sm mt-2">
            {error}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="w-full">
          {renderChart('rain', historicalData.rain)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderChart('temperature', historicalData.temperature)}
          {renderChart('humidity', historicalData.humidity)}
          {renderChart('pressure', historicalData.pressure)}
          {renderChart('moisture', historicalData.moisture)}
        </div>
      </div>
    </div>
  );
}
