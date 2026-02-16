-- =====================================================
-- TMS (Transportation Management System) - Database Schema
-- บริษัท ชื้อฮะฮวด อุตสาหกรรม จำกัด
-- รันใน Supabase SQL Editor
-- =====================================================

-- =====================================================
-- Table 1: vehicles
-- =====================================================
create table if not exists vehicles (
    "vehicleId" uuid default gen_random_uuid() primary key,
    "vehiclePlateNumber" text not null unique,
    "vehicleName" text not null,
    "vehicleType" text not null default 'truck' check ("vehicleType" in ('truck', 'pickup', 'van', 'trailer')),
    "vehicleBrand" text,
    "vehicleModel" text,
    "vehicleYear" integer,
    "vehicleColor" text,
    "vehicleVinNumber" text,
    "vehicleRegistrationExpiry" date,
    "vehicleInsuranceExpiry" date,
    "vehicleInsurancePolicy" text,
    "vehicleActExpiry" date,
    "vehicleCapacityKg" numeric(10,2),
    "vehicleFuelType" text default 'diesel' check ("vehicleFuelType" in ('diesel', 'gasoline', 'ngv', 'electric')),
    "vehicleCurrentMileage" numeric(12,2) default 0,
    "vehicleStatus" text not null default 'available' check ("vehicleStatus" in ('available', 'in_use', 'maintenance', 'retired')),
    "vehicleNotes" text,
    "vehicleCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "vehicleUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Table 2: drivers
-- =====================================================
create table if not exists drivers (
    "driverId" uuid default gen_random_uuid() primary key,
    "driverEmployeeId" uuid references employees("employeeId") on delete set null,
    "driverFirstName" text not null,
    "driverLastName" text not null,
    "driverPhone" text,
    "driverLicenseNumber" text,
    "driverLicenseType" text default 'type2' check ("driverLicenseType" in ('type1', 'type2', 'type3', 'type4')),
    "driverLicenseExpiry" date,
    "driverRole" text not null default 'driver' check ("driverRole" in ('driver', 'assistant')),
    "driverStatus" text not null default 'available' check ("driverStatus" in ('available', 'on_duty', 'on_leave', 'inactive')),
    "driverNotes" text,
    "driverCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "driverUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Table 3: routes
-- =====================================================
create table if not exists routes (
    "routeId" uuid default gen_random_uuid() primary key,
    "routeName" text not null,
    "routeOrigin" text not null default 'CHH Factory',
    "routeOriginLat" numeric(10,7),
    "routeOriginLng" numeric(10,7),
    "routeDestination" text not null,
    "routeDestinationLat" numeric(10,7),
    "routeDestinationLng" numeric(10,7),
    "routeDistanceKm" numeric(8,2),
    "routeEstimatedMinutes" integer,
    "routeNotes" text,
    "routeStatus" text not null default 'active' check ("routeStatus" in ('active', 'inactive')),
    "routeCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "routeUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Table 4: shipments
-- =====================================================
create table if not exists shipments (
    "shipmentId" uuid default gen_random_uuid() primary key,
    "shipmentNumber" text not null unique,
    "shipmentDate" date not null default current_date,
    "shipmentCustomerName" text not null,
    "shipmentCustomerPhone" text,
    "shipmentCustomerAddress" text,
    "shipmentOrigin" text not null default 'CHH Factory',
    "shipmentDestination" text not null,
    "shipmentDestinationLat" numeric(10,7),
    "shipmentDestinationLng" numeric(10,7),
    "shipmentRouteId" uuid references routes("routeId") on delete set null,
    "shipmentVehicleId" uuid references vehicles("vehicleId") on delete set null,
    "shipmentDriverId" uuid references drivers("driverId") on delete set null,
    "shipmentAssistantId" uuid references drivers("driverId") on delete set null,
    "shipmentSalesOrderRef" text,
    "shipmentItemsSummary" text,
    "shipmentWeightKg" numeric(10,2),
    "shipmentStatus" text not null default 'draft' check ("shipmentStatus" in (
        'draft', 'confirmed', 'dispatched', 'in_transit', 'arrived', 'delivered', 'pod_confirmed', 'cancelled'
    )),
    "shipmentDispatchedAt" timestamp with time zone,
    "shipmentDeliveredAt" timestamp with time zone,
    "shipmentEstimatedArrival" timestamp with time zone,
    "shipmentNotes" text,
    "shipmentCreatedBy" uuid references auth.users(id) on delete set null,
    "shipmentCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "shipmentUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Table 5: deliveries (Proof of Delivery)
-- =====================================================
create table if not exists deliveries (
    "deliveryId" uuid default gen_random_uuid() primary key,
    "deliveryShipmentId" uuid not null references shipments("shipmentId") on delete cascade,
    "deliveryReceiverName" text,
    "deliveryReceiverPhone" text,
    "deliverySignatureUrl" text,
    "deliveryPhotoUrls" jsonb default '[]'::jsonb,
    "deliveryStatus" text not null default 'pending' check ("deliveryStatus" in ('pending', 'delivered_ok', 'delivered_partial', 'delivered_damaged', 'refused', 'returned')),
    "deliveryDamageNotes" text,
    "deliveryReceivedAt" timestamp with time zone,
    "deliveryNotes" text,
    "deliveryCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "deliveryUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Table 6: fuelLogs
-- =====================================================
create table if not exists "fuelLogs" (
    "fuelLogId" uuid default gen_random_uuid() primary key,
    "fuelLogVehicleId" uuid not null references vehicles("vehicleId") on delete cascade,
    "fuelLogDriverId" uuid references drivers("driverId") on delete set null,
    "fuelLogDate" date not null default current_date,
    "fuelLogFuelType" text not null default 'diesel' check ("fuelLogFuelType" in ('diesel', 'gasoline', 'ngv', 'electric')),
    "fuelLogLiters" numeric(8,2) not null,
    "fuelLogPricePerLiter" numeric(8,2) not null,
    "fuelLogTotalCost" numeric(10,2) not null,
    "fuelLogMileage" numeric(12,2),
    "fuelLogStation" text,
    "fuelLogReceiptUrl" text,
    "fuelLogNotes" text,
    "fuelLogCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "fuelLogUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Table 7: maintenances
-- =====================================================
create table if not exists maintenances (
    "maintenanceId" uuid default gen_random_uuid() primary key,
    "maintenanceVehicleId" uuid not null references vehicles("vehicleId") on delete cascade,
    "maintenanceType" text not null default 'repair' check ("maintenanceType" in ('preventive', 'repair', 'inspection', 'tire', 'oil_change', 'other')),
    "maintenanceDescription" text not null,
    "maintenanceDate" date not null default current_date,
    "maintenanceCompletedDate" date,
    "maintenanceMileage" numeric(12,2),
    "maintenanceCost" numeric(10,2) default 0,
    "maintenanceVendor" text,
    "maintenanceStatus" text not null default 'scheduled' check ("maintenanceStatus" in ('scheduled', 'in_progress', 'completed', 'cancelled')),
    "maintenanceNextDueDate" date,
    "maintenanceNextDueMileage" numeric(12,2),
    "maintenanceNotes" text,
    "maintenanceCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "maintenanceUpdatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Table 8: gpsLogs (append-only)
-- =====================================================
create table if not exists "gpsLogs" (
    "gpsLogId" uuid default gen_random_uuid() primary key,
    "gpsLogVehicleId" uuid not null references vehicles("vehicleId") on delete cascade,
    "gpsLogShipmentId" uuid references shipments("shipmentId") on delete set null,
    "gpsLogLatitude" numeric(10,7) not null,
    "gpsLogLongitude" numeric(10,7) not null,
    "gpsLogSpeed" numeric(6,2),
    "gpsLogHeading" numeric(5,2),
    "gpsLogSource" text default 'manual' check ("gpsLogSource" in ('manual', 'gps_device', 'mobile_app')),
    "gpsLogRecordedAt" timestamp with time zone default timezone('utc'::text, now()) not null,
    "gpsLogCreatedAt" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- Row Level Security
-- =====================================================
alter table vehicles enable row level security;
alter table drivers enable row level security;
alter table routes enable row level security;
alter table shipments enable row level security;
alter table deliveries enable row level security;
alter table "fuelLogs" enable row level security;
alter table maintenances enable row level security;
alter table "gpsLogs" enable row level security;

-- vehicles
create policy "Authenticated read vehicles" on vehicles for select using (auth.role() = 'authenticated');
create policy "Authenticated insert vehicles" on vehicles for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update vehicles" on vehicles for update using (auth.role() = 'authenticated');
create policy "Authenticated delete vehicles" on vehicles for delete using (auth.role() = 'authenticated');

-- drivers
create policy "Authenticated read drivers" on drivers for select using (auth.role() = 'authenticated');
create policy "Authenticated insert drivers" on drivers for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update drivers" on drivers for update using (auth.role() = 'authenticated');
create policy "Authenticated delete drivers" on drivers for delete using (auth.role() = 'authenticated');

-- routes
create policy "Authenticated read routes" on routes for select using (auth.role() = 'authenticated');
create policy "Authenticated insert routes" on routes for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update routes" on routes for update using (auth.role() = 'authenticated');
create policy "Authenticated delete routes" on routes for delete using (auth.role() = 'authenticated');

-- shipments
create policy "Authenticated read shipments" on shipments for select using (auth.role() = 'authenticated');
create policy "Authenticated insert shipments" on shipments for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update shipments" on shipments for update using (auth.role() = 'authenticated');
create policy "Authenticated delete shipments" on shipments for delete using (auth.role() = 'authenticated');

-- deliveries
create policy "Authenticated read deliveries" on deliveries for select using (auth.role() = 'authenticated');
create policy "Authenticated insert deliveries" on deliveries for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update deliveries" on deliveries for update using (auth.role() = 'authenticated');
create policy "Authenticated delete deliveries" on deliveries for delete using (auth.role() = 'authenticated');

-- fuelLogs
create policy "Authenticated read fuelLogs" on "fuelLogs" for select using (auth.role() = 'authenticated');
create policy "Authenticated insert fuelLogs" on "fuelLogs" for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update fuelLogs" on "fuelLogs" for update using (auth.role() = 'authenticated');
create policy "Authenticated delete fuelLogs" on "fuelLogs" for delete using (auth.role() = 'authenticated');

-- maintenances
create policy "Authenticated read maintenances" on maintenances for select using (auth.role() = 'authenticated');
create policy "Authenticated insert maintenances" on maintenances for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update maintenances" on maintenances for update using (auth.role() = 'authenticated');
create policy "Authenticated delete maintenances" on maintenances for delete using (auth.role() = 'authenticated');

-- gpsLogs
create policy "Authenticated read gpsLogs" on "gpsLogs" for select using (auth.role() = 'authenticated');
create policy "Authenticated insert gpsLogs" on "gpsLogs" for insert with check (auth.role() = 'authenticated');

-- =====================================================
-- Triggers for updatedAt
-- =====================================================
create or replace function update_vehicle_updated_at() returns trigger as $$
begin new."vehicleUpdatedAt" = timezone('utc'::text, now()); return new; end;
$$ language plpgsql;

create or replace function update_driver_updated_at() returns trigger as $$
begin new."driverUpdatedAt" = timezone('utc'::text, now()); return new; end;
$$ language plpgsql;

create or replace function update_route_updated_at() returns trigger as $$
begin new."routeUpdatedAt" = timezone('utc'::text, now()); return new; end;
$$ language plpgsql;

create or replace function update_shipment_updated_at() returns trigger as $$
begin new."shipmentUpdatedAt" = timezone('utc'::text, now()); return new; end;
$$ language plpgsql;

create or replace function update_delivery_updated_at() returns trigger as $$
begin new."deliveryUpdatedAt" = timezone('utc'::text, now()); return new; end;
$$ language plpgsql;

create or replace function update_fuel_log_updated_at() returns trigger as $$
begin new."fuelLogUpdatedAt" = timezone('utc'::text, now()); return new; end;
$$ language plpgsql;

create or replace function update_maintenance_updated_at() returns trigger as $$
begin new."maintenanceUpdatedAt" = timezone('utc'::text, now()); return new; end;
$$ language plpgsql;

drop trigger if exists trg_vehicles_updated on vehicles;
create trigger trg_vehicles_updated before update on vehicles for each row execute function update_vehicle_updated_at();

drop trigger if exists trg_drivers_updated on drivers;
create trigger trg_drivers_updated before update on drivers for each row execute function update_driver_updated_at();

drop trigger if exists trg_routes_updated on routes;
create trigger trg_routes_updated before update on routes for each row execute function update_route_updated_at();

drop trigger if exists trg_shipments_updated on shipments;
create trigger trg_shipments_updated before update on shipments for each row execute function update_shipment_updated_at();

drop trigger if exists trg_deliveries_updated on deliveries;
create trigger trg_deliveries_updated before update on deliveries for each row execute function update_delivery_updated_at();

drop trigger if exists trg_fuel_logs_updated on "fuelLogs";
create trigger trg_fuel_logs_updated before update on "fuelLogs" for each row execute function update_fuel_log_updated_at();

drop trigger if exists trg_maintenances_updated on maintenances;
create trigger trg_maintenances_updated before update on maintenances for each row execute function update_maintenance_updated_at();

-- =====================================================
-- Indexes for performance
-- =====================================================
create index if not exists idx_shipments_status on shipments("shipmentStatus");
create index if not exists idx_shipments_date on shipments("shipmentDate");
create index if not exists idx_shipments_vehicle on shipments("shipmentVehicleId");
create index if not exists idx_fuel_logs_vehicle on "fuelLogs"("fuelLogVehicleId");
create index if not exists idx_fuel_logs_date on "fuelLogs"("fuelLogDate");
create index if not exists idx_maintenances_vehicle on maintenances("maintenanceVehicleId");
create index if not exists idx_gps_logs_vehicle_time on "gpsLogs"("gpsLogVehicleId", "gpsLogRecordedAt" desc);
create index if not exists idx_gps_logs_shipment on "gpsLogs"("gpsLogShipmentId");
create index if not exists idx_drivers_role on drivers("driverRole");
create index if not exists idx_deliveries_shipment on deliveries("deliveryShipmentId");

-- =====================================================
-- Shipment number auto-generation
-- =====================================================
create sequence if not exists shipment_number_seq start 1;

create or replace function generate_shipment_number()
returns trigger as $$
begin
    if new."shipmentNumber" is null or new."shipmentNumber" = '' then
        new."shipmentNumber" = 'SHP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('shipment_number_seq')::text, 4, '0');
    end if;
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_shipment_number on shipments;
create trigger set_shipment_number
    before insert on shipments
    for each row execute function generate_shipment_number();

-- =====================================================
-- Seed Data: CHH Vehicles
-- =====================================================
insert into vehicles ("vehiclePlateNumber", "vehicleName", "vehicleType", "vehicleBrand", "vehicleFuelType", "vehicleStatus") values
    ('1ก-1234 กทม', 'รถบรรทุก 1', 'truck', 'ISUZU', 'diesel', 'available'),
    ('2ก-5678 กทม', 'รถบรรทุก 2', 'truck', 'ISUZU', 'diesel', 'available'),
    ('3ก-9012 กทม', 'รถบรรทุก 3', 'truck', 'HINO', 'diesel', 'available'),
    ('4ก-3456 กทม', 'รถบรรทุก 4', 'truck', 'HINO', 'diesel', 'available')
on conflict ("vehiclePlateNumber") do nothing;

-- =====================================================
-- Seed Data: Common Routes
-- =====================================================
insert into routes ("routeName", "routeOrigin", "routeDestination", "routeDistanceKm", "routeEstimatedMinutes") values
    ('กรุงเทพ - สมุทรปราการ', 'CHH Factory', 'สมุทรปราการ', 45, 60),
    ('กรุงเทพ - นนทบุรี', 'CHH Factory', 'นนทบุรี', 30, 45),
    ('กรุงเทพ - ปทุมธานี', 'CHH Factory', 'ปทุมธานี', 40, 50),
    ('กรุงเทพ - ชลบุรี', 'CHH Factory', 'ชลบุรี', 120, 150);
