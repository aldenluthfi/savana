-- Create sensor_data table
CREATE TABLE IF NOT EXISTS sensor_data (
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sensor_data_created_at ON sensor_data(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on sensor_data" ON sensor_data
    FOR ALL USING (true);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sensor_data_updated_at
    BEFORE UPDATE ON sensor_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
