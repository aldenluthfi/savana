-- Add index for better performance when querying multiple nodes
CREATE INDEX IF NOT EXISTS idx_sensor_data_id_node ON sensor_data(id_node);
CREATE INDEX IF NOT EXISTS idx_sensor_data_waktu ON sensor_data(waktu);
CREATE INDEX IF NOT EXISTS idx_sensor_data_node_time ON sensor_data(id_node, waktu);

-- Add a view for easier querying of latest data per node
CREATE OR REPLACE VIEW latest_sensor_data AS
SELECT DISTINCT ON (id_node)
    id_node,
    waktu,
    temperature,
    humidity,
    pressure,
    moisture,
    rain,
    created_at,
    updated_at
FROM sensor_data
ORDER BY id_node, waktu DESC;
