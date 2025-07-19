import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
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

interface MultiNodeChartDataPoint {
  time: string;
  node1: number | null;
  node2: number | null;
  timestamp: number;
}

type DateRange = '1hari' | '1minggu' | '1bulan' | '1tahun' | 'semua';

const nodeConfigs = {
  [import.meta.env.VITE_NODE_ID_1]: {
    name: "Node 1",
    color: "#3b82f6",
  },
  [import.meta.env.VITE_NODE_ID_2]: {
    name: "Node 2",
    color: "#eab308",
  },
};

const dateRangeOptions = [
  { value: '1hari', label: '1 Hari' },
  { value: '1minggu', label: '1 Minggu' },
  { value: '1bulan', label: '1 Bulan' },
  { value: '1tahun', label: '1 Tahun' },
  { value: 'semua', label: 'Semua Data' },
];

export default function SensorChart() {
  const [historicalData, setHistoricalData] = useState<{
    temperature: MultiNodeChartDataPoint[];
    humidity: MultiNodeChartDataPoint[];
    pressure: MultiNodeChartDataPoint[];
    moisture: MultiNodeChartDataPoint[];
    rain: MultiNodeChartDataPoint[];
  }>({
    temperature: [],
    humidity: [],
    pressure: [],
    moisture: [],
    rain: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>('1minggu');
  const [enabledNodes, setEnabledNodes] = useState<{ [key: string]: boolean }>({
    [import.meta.env.VITE_NODE_ID_1]: true,
    [import.meta.env.VITE_NODE_ID_2]: true,
  });

  const fetchHistoricalData = async (dateRange: DateRange = selectedDateRange) => {
    try {
      // Get enabled node IDs
      const enabledNodeIds = Object.entries(enabledNodes)
        .filter(([_, enabled]) => enabled)
        .map(([nodeId, _]) => nodeId);

      // If no nodes are enabled, return empty data
      if (enabledNodeIds.length === 0) {
        setHistoricalData({
          temperature: [],
          humidity: [],
          pressure: [],
          moisture: [],
          rain: [],
        });
        return;
      }

      let query = supabase
        .from('sensor_data')
        .select('*')
        .in('id_node', enabledNodeIds)
        .order('waktu', { ascending: true });

      // Apply date filtering at query level
      if (dateRange !== 'semua') {
        const now = new Date();
        let filterDate: Date;

        switch (dateRange) {
          case '1hari':
            filterDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '1minggu':
            filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '1bulan':
            filterDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '1tahun':
            filterDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        query = query.gte('waktu', filterDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching historical data:', error);
        return;
      }

      if (data) {
        // Group data by timestamp and combine both nodes
        const groupedData: { [timestamp: string]: { [nodeId: string]: SensorDataRow } } = {};

        data.forEach((item: SensorDataRow) => {
          const utcDate = new Date(item.waktu + 'Z');
          const timeKey = utcDate.toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
          });

          if (!groupedData[timeKey]) {
            groupedData[timeKey] = {};
          }
          groupedData[timeKey][item.id_node] = item;
        });

        // Convert to chart format
        const timestamps = Object.keys(groupedData).sort();

        const processedData = {
          temperature: timestamps.map(timeKey => ({
            time: timeKey,
            node1: groupedData[timeKey][import.meta.env.VITE_NODE_ID_1]?.temperature ?? null,
            node2: groupedData[timeKey][import.meta.env.VITE_NODE_ID_2]?.temperature ?? null,
            timestamp: new Date(Object.values(groupedData[timeKey])[0].waktu + 'Z').getTime(),
          })),
          humidity: timestamps.map(timeKey => ({
            time: timeKey,
            node1: groupedData[timeKey][import.meta.env.VITE_NODE_ID_1]?.humidity ?? null,
            node2: groupedData[timeKey][import.meta.env.VITE_NODE_ID_2]?.humidity ?? null,
            timestamp: new Date(Object.values(groupedData[timeKey])[0].waktu + 'Z').getTime(),
          })),
          pressure: timestamps.map(timeKey => ({
            time: timeKey,
            node1: groupedData[timeKey][import.meta.env.VITE_NODE_ID_1]?.pressure ?? null,
            node2: groupedData[timeKey][import.meta.env.VITE_NODE_ID_2]?.pressure ?? null,
            timestamp: new Date(Object.values(groupedData[timeKey])[0].waktu + 'Z').getTime(),
          })),
          moisture: timestamps.map(timeKey => ({
            time: timeKey,
            node1: groupedData[timeKey][import.meta.env.VITE_NODE_ID_1]?.moisture ?? null,
            node2: groupedData[timeKey][import.meta.env.VITE_NODE_ID_2]?.moisture ?? null,
            timestamp: new Date(Object.values(groupedData[timeKey])[0].waktu + 'Z').getTime(),
          })),
          rain: timestamps.map(timeKey => ({
            time: timeKey,
            node1: groupedData[timeKey][import.meta.env.VITE_NODE_ID_1]?.rain ?? null,
            node2: groupedData[timeKey][import.meta.env.VITE_NODE_ID_2]?.rain ?? null,
            timestamp: new Date(Object.values(groupedData[timeKey])[0].waktu + 'Z').getTime(),
          })),
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
        await fetchHistoricalData(selectedDateRange);
      }
    } catch (err) {
      console.error('Error storing sensor data:', err);
    }
  };

  const fetchNodeData = async (nodeId: string) => {
    const apiUrl = `${import.meta.env.VITE_API_URL}?id_node=${nodeId}&api_key=${import.meta.env.VITE_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} for node ${nodeId}`);
    }

    const result: ApiResponse = await response.json();

    if (result.status !== 'Ok') {
      throw new Error(`API error: ${result.status} for node ${nodeId}`);
    }

    return result.data;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchHistoricalData(selectedDateRange);

        // Fetch data from both nodes
        const nodeIds = [import.meta.env.VITE_NODE_ID_1, import.meta.env.VITE_NODE_ID_2];
        const nodeDataPromises = nodeIds.map(nodeId =>
          fetchNodeData(nodeId).catch(err => {
            console.error(`Error fetching data for node ${nodeId}:`, err);
            return null;
          })
        );

        const nodeResults = await Promise.all(nodeDataPromises);
        const newApiData: { [key: string]: SensorData } = {};

        nodeResults.forEach((data, index) => {
          if (data) {
            newApiData[nodeIds[index]] = data;
          }
        });

        for (const data of Object.values(newApiData)) {
          await storeSensorData(data);
        }

        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        await fetchHistoricalData(selectedDateRange);

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

  useEffect(() => {
    fetchHistoricalData(selectedDateRange);
  }, [selectedDateRange, enabledNodes]);

  const toggleNode = (nodeId: string) => {
    setEnabledNodes(prev => {
      const newState = { ...prev };

      // If turning off this node
      if (prev[nodeId]) {
        // Check if this is the only enabled node
        const enabledCount = Object.values(prev).filter(Boolean).length;

        if (enabledCount === 1) {
          // Turn off this node and turn on all other nodes
          Object.keys(newState).forEach(id => {
            newState[id] = id !== nodeId;
          });
        } else {
          // Just turn off this node
          newState[nodeId] = false;
        }
      } else {
        // Turning on this node
        newState[nodeId] = true;
      }

      return newState;
    });
  };

  const renderMultiNodeChart = (dataKey: string, data: MultiNodeChartDataPoint[], label: string, unit: string) => {
    const filteredData = dataKey === 'moisture' 
      ? data.map(point => ({
          ...point,
          node1: point.node1 === -99 ? null : point.node1,
          node2: point.node2 === -99 ? null : point.node2,
        }))
      : data;

    return (
      <Card key={dataKey} className="w-full">
        <CardHeader>
          <CardTitle>{label} ({unit})</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              node1: {
                label: nodeConfigs[import.meta.env.VITE_NODE_ID_1]?.name || "Node 1",
                color: nodeConfigs[import.meta.env.VITE_NODE_ID_1]?.color
              },
              node2: {
                label: nodeConfigs[import.meta.env.VITE_NODE_ID_2]?.name || "Node 2",
                color: nodeConfigs[import.meta.env.VITE_NODE_ID_2]?.color
              }
            }}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart
              accessibilityLayer
              data={filteredData}
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
                    className="w-[200px]"
                    labelFormatter={(label, payload) => {
                      if (Array.isArray(payload) && payload.length > 0) {
                        const dataPoint = payload[0].payload as MultiNodeChartDataPoint;
                        const date = new Date(dataPoint.timestamp);
                        const formattedDate = date.toLocaleString('id-ID', {
                          timeZone: 'Asia/Jakarta',
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        return formattedDate;
                      }
                      return label;
                    }}
                    indicator="dot"
                    formatter={(value) => [
                      value !== null && value !== undefined && value !== -99 ? `${value} ${unit}` : 'No data'
                    ]}
                  />
                }
              />
              {enabledNodes[import.meta.env.VITE_NODE_ID_1] && (
                <Area
                  dataKey="node1"
                  type="natural"
                  fill={nodeConfigs[import.meta.env.VITE_NODE_ID_1]?.color}
                  stroke={nodeConfigs[import.meta.env.VITE_NODE_ID_1]?.color}
                  strokeWidth={2}
                  fillOpacity={0.6}
                />
              )}
              {enabledNodes[import.meta.env.VITE_NODE_ID_2] && (
                <Area
                  dataKey="node2"
                  type="natural"
                  fill={nodeConfigs[import.meta.env.VITE_NODE_ID_2]?.color}
                  stroke={nodeConfigs[import.meta.env.VITE_NODE_ID_2]?.color}
                  strokeWidth={2}
                  fillOpacity={0.6}
                />
              )}
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
            <CardDescription>Mengambil data lingkungan dari kedua node sensor...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Data Cuaca Wonokitri</h1>
        {error && (
          <div className="text-amber-600 text-sm mt-2">
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <Select value={selectedDateRange} onValueChange={(value: DateRange) => setSelectedDateRange(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Pilih rentang waktu" />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            {Object.entries(nodeConfigs).map(([nodeId, config]) => (
              <div key={nodeId} className="flex items-center space-x-3">
                <Switch
                  checked={enabledNodes[nodeId]}
                  onCheckedChange={() => toggleNode(nodeId)}
                  id={`node-${nodeId}`}
                />
                <label
                  htmlFor={`node-${nodeId}`}
                  className="text-sm flex items-center space-x-2 cursor-pointer"
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: config.color }}
                  />
                  <span>{config.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {nodeId}
                  </Badge>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="w-full">
          {renderMultiNodeChart('rain', historicalData.rain, 'Curah Hujan', 'mm')}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderMultiNodeChart('temperature', historicalData.temperature, 'Suhu', '°C')}
          {renderMultiNodeChart('humidity', historicalData.humidity, 'Kelembapan', '%')}
          {renderMultiNodeChart('pressure', historicalData.pressure, 'Tekanan', 'hPa')}
          {renderMultiNodeChart('moisture', historicalData.moisture, 'Kelembapan Tanah', '%')}
        </div>
      </div>
    </div>
  );
}