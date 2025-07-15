import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
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
    label: "Temperature (°C)",
    color: "hsl(var(--chart-1))",
    unit: "°C",
  },
  humidity: {
    label: "Humidity (%)",
    color: "hsl(var(--chart-2))",
    unit: "%",
  },
  pressure: {
    label: "Pressure (hPa)",
    color: "hsl(var(--chart-3))",
    unit: "hPa",
  },
  moisture: {
    label: "Moisture (%)",
    color: "hsl(var(--chart-4))",
    unit: "%",
  },
  rain: {
    label: "Rain (mm)",
    color: "hsl(var(--chart-5))",
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
        .limit(50);

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
        console.log("Fetching sensor data from:", apiUrl); // Debug log

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
          <CardTitle>{config.label}</CardTitle>
          <CardDescription>
            {data.length > 0 ? `${data.length} data points` : 'No data available'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ [dataKey]: config }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [
                    `${value.toFixed(2)} ${config.unit}`,
                    config.label
                  ]}
                  labelFormatter={(label: string) => `Time: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={config.color}
                  strokeWidth={2}
                  dot={{ fill: config.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
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
            <CardTitle>Loading Sensor Data...</CardTitle>
            <CardDescription>Fetching environmental data...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Cuaca Wonokitri</CardTitle>
          <CardDescription>
            {apiData ? (
              <>Node: {apiData.id_node} | Last Updated: {new Date(apiData.waktu + 'Z').toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</>
            ) : (
              'Historical data view'
            )}
            {error && (
              <div className="text-amber-600 text-sm mt-2">
                {error}
              </div>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(historicalData).map(([key, data]) =>
          renderChart(key as keyof typeof chartConfigs, data)
        )}
      </div>
    </div>
  );
}
