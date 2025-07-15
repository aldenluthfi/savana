import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
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

const chartConfig = {
  temperature: {
    label: "Temperature (°C)",
    color: "var(--chart-1)",
  },
  humidity: {
    label: "Humidity (%)",
    color: "var(--chart-2)",
  },
  pressure: {
    label: "Pressure (hPa)",
    color: "var(--chart-3)",
  },
  moisture: {
    label: "Moisture (%)",
    color: "var(--chart-4)",
  },
  rain: {
    label: "Rain (mm)",
    color: "var(--chart-5)",
  },
  value: {
    label: "Value",
  },
};

export default function SensorChart() {
  const [data, setData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      }
    } catch (err) {
      console.error('Error storing sensor data:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
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

        setData(result.data);

        await storeSensorData(result.data);

        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
          setError('Network error: Unable to connect to the API. This might be due to CORS restrictions or network issues.');
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

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Loading Sensor Data...</CardTitle>
          <CardDescription>Fetching environmental data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Connection Error</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 mt-2">
            <p>Possible solutions:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Check your internet connection</li>
              <li>The API server might be temporarily unavailable</li>
              <li>CORS policy might be blocking the request</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const chartData = [
    {
      name: "Temperature",
      value: data.data_node.temp,
      fill: "var(--color-temperature)",
    },
    {
      name: "Humidity",
      value: data.data_node.rh,
      fill: "var(--color-humidity)",
    },
    {
      name: "Pressure",
      value: data.data_node.press / 10,
      fill: "var(--color-pressure)",
    },
    {
      name: "Moisture",
      value: data.data_node.mous,
      fill: "var(--color-moisture)",
    },
    {
      name: "Rain",
      value: data.data_node.rain,
      fill: "var(--color-rain)",
    },
  ];

  return (
    <Card className="w-full mx-32">
      <CardHeader>
        <CardTitle>Data Cuaca Wonokitri</CardTitle>
        <CardDescription>
          Node: {data.id_node} | Last Updated: {new Date(data.waktu).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              className="text-xs"
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value: number, name: string) => {
                if (name === "Pressure") {
                  return [(value * 10).toFixed(2) + " hPa", "Pressure"];
                }
                const unit = name === "Temperature" ? "°C" :
                  name === "Humidity" || name === "Moisture" ? "%" :
                    name === "Rain" ? "mm" : "";
                return [value.toFixed(2) + " " + unit, name];
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
