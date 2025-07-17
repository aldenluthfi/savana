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
    color: "#3b82f6", // blue-500
  },
  [import.meta.env.VITE_NODE_ID_2]: {
    name: "Node 2",
    color: "#eab308", // yellow-500
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
  const [apiData, setApiData] = useState<{ [key: string]: SensorData }>({});
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

  const getDateRangeFilter = (range: DateRange): Date | null => {
    const now = new Date();
    switch (range) {
      case '1hari':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '1minggu':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '1bulan':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '1tahun':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case 'semua':
        return null;
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  };

  const fetchHistoricalData = async (dateRange: DateRange = selectedDateRange) => {
    try {
      let query = supabase
        .from('sensor_data')
        .select('*')
        .order('waktu', { ascending: true });

      const dateFilter = getDateRangeFilter(dateRange);
      if (dateFilter) {
        query = query.gte('waktu', dateFilter.toISOString());
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
        console.log('Sensor data stored/updated successfully');
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

        setApiData(newApiData);

        // Store data for each node
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
  }, [selectedDateRange]);

  const toggleNode = (nodeId: string) => {
    setEnabledNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const renderMultiNodeChart = (dataKey: string, data: MultiNodeChartDataPoint[], label: string, unit: string) => {
    return (
      <Card key={dataKey} className="w-full">
        <CardHeader>
          <CardTitle>{label} ({unit})</CardTitle>
          <CardDescription>Data dari kedua sensor node</CardDescription>
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
                    className="w-[200px]"
                    labelFormatter={(label, payload) => {
                      if (Array.isArray(payload) && payload.length > 0) {
                        const hoveredNode = payload[0].name;
                        const nodeName =
                          hoveredNode === 'node1'
                            ? nodeConfigs[import.meta.env.VITE_NODE_ID_1]?.name || "Node 1"
                            : nodeConfigs[import.meta.env.VITE_NODE_ID_2]?.name || "Node 2";
                        return `${label} (${nodeName})`;
                      }
                      return label;
                    }}
                    indicator="dot"
                    formatter={(value) => [
                      value ? `${value} ${unit}` : 'No data'
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

  const latestData = Object.values(apiData);
  const hasApiData = latestData.length > 0;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Data Cuaca Wonokitri</h1>
        <div className="text-base mt-1">
          {hasApiData ? (
            <div className="space-y-1">
              {latestData.map((data) => (
                <div key={data.id_node}>
                  Node {data.id_node}: Last Updated {new Date(data.waktu + 'Z').toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                </div>
              ))}
            </div>
          ) : (
            'Historical data view - Multiple nodes'
          )}
        </div>
        {error && (
          <div className="text-amber-600 text-sm mt-2">
            {error}
          </div>
        )}
      </div>

      {/* Controls Panel */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Pengaturan Display</CardTitle>
          <CardDescription>Atur rentang waktu dan node yang ditampilkan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range Selector */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Rentang Waktu:</label>
            <Select value={selectedDateRange} onValueChange={(value: DateRange) => setSelectedDateRange(value)}>
              <SelectTrigger className="w-full md:w-48">
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

          {/* Node Filters */}
          <div className="flex flex-col space-y-3">
            <label className="text-sm font-medium">Filter Node:</label>
            <div className="flex flex-wrap gap-4">
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
        </CardContent>
      </Card>

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