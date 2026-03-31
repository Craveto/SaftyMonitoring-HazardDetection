CREATE TABLE users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100) NOT NULL,
  email NVARCHAR(150) NOT NULL UNIQUE,
  role NVARCHAR(30) NOT NULL DEFAULT 'operator',
  password NVARCHAR(255) NOT NULL
);

CREATE TABLE sensor_readings (
  id INT IDENTITY(1,1) PRIMARY KEY,
  [timestamp] DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  gas_level FLOAT NOT NULL,
  temperature FLOAT NOT NULL,
  pressure FLOAT NOT NULL,
  smoke_level FLOAT NOT NULL,
  location NVARCHAR(80) NOT NULL,
  shift NVARCHAR(20) NOT NULL,
  source_type NVARCHAR(20) NOT NULL DEFAULT 'manual',
  remarks NVARCHAR(255) NULL,
  alarm BIT NULL,
  predicted_risk_score FLOAT NULL
);

CREATE TABLE hazard_alerts (
  id INT IDENTITY(1,1) PRIMARY KEY,
  reading_id INT NOT NULL,
  severity NVARCHAR(20) NOT NULL,
  risk_score FLOAT NOT NULL,
  rule_triggered NVARCHAR(255) NULL,
  ml_triggered BIT NOT NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'new',
  created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  CONSTRAINT FK_hazard_alert_reading FOREIGN KEY (reading_id) REFERENCES sensor_readings(id)
);

CREATE TABLE incidents (
  id INT IDENTITY(1,1) PRIMARY KEY,
  alert_id INT NOT NULL,
  title NVARCHAR(120) NOT NULL,
  summary NVARCHAR(500) NULL,
  status NVARCHAR(20) NOT NULL DEFAULT 'new',
  opened_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  closed_at DATETIME2 NULL,
  CONSTRAINT FK_incident_alert FOREIGN KEY (alert_id) REFERENCES hazard_alerts(id)
);

