export const DUMMY_USER_ADMIN = {
  id: 'u1',
  full_name: 'Rajesh Kumar',
  email: 'rajesh@metalworks.in',
  role: 'admin',
  organization_id: 'org1',
  department_id: null,
  avatar_url: null,
};

export const DUMMY_USER_DEPT_HEAD = {
  id: 'u2',
  full_name: 'Amit Sharma',
  email: 'amit@metalworks.in',
  role: 'department_head',
  organization_id: 'org1',
  department_id: 'd1',
  avatar_url: null,
};

export const DUMMY_ORG = {
  id: 'org1',
  name: 'MetalWorks Industries',
  industry_type: 'Metal Manufacturing',
  logo_url: null,
  ownership_type: 'partnership',
  created_at: '2024-01-15T00:00:00Z',
};

export const DUMMY_OWNERS = [
  { id: 'own1', organization_id: 'org1', full_name: 'Rajesh Kumar', email: 'rajesh@metalworks.in', phone: '+91 98765 43200', ownership_share: 60, role: 'Managing Partner', joined_date: '2024-01-15', is_primary: true },
  { id: 'own2', organization_id: 'org1', full_name: 'Sunita Devi', email: 'sunita@metalworks.in', phone: '+91 98765 43201', ownership_share: 25, role: 'Partner', joined_date: '2024-01-15', is_primary: false },
  { id: 'own3', organization_id: 'org1', full_name: 'Vikram Malhotra', email: 'vikram@metalworks.in', phone: '+91 98765 43202', ownership_share: 15, role: 'Partner', joined_date: '2024-06-01', is_primary: false },
];

export const DUMMY_DEPARTMENTS = [
  { id: 'd1', organization_id: 'org1', name: 'Copper Plant', description: 'Primary copper processing unit', head_profile_id: 'u2', created_at: '2024-01-20T00:00:00Z' },
  { id: 'd2', organization_id: 'org1', name: 'Square Utensils', description: 'Square and rectangular utensil production', head_profile_id: null, created_at: '2024-01-22T00:00:00Z' },
  { id: 'd3', organization_id: 'org1', name: 'Circle Patti Cutting', description: 'Circular disc and patti cutting section', head_profile_id: null, created_at: '2024-02-01T00:00:00Z' },
  { id: 'd4', organization_id: 'org1', name: 'Scrap Department', description: 'Scrap collection, sorting, and recycling', head_profile_id: null, created_at: '2024-02-05T00:00:00Z' },
  { id: 'd5', organization_id: 'org1', name: 'Rolling Sheet Mill', description: 'Sheet rolling and flattening operations', head_profile_id: null, created_at: '2024-02-10T00:00:00Z' },
  { id: 'd6', organization_id: 'org1', name: 'Quality Control', description: 'Final inspection and quality assurance', head_profile_id: null, created_at: '2024-03-01T00:00:00Z' },
];

export const DUMMY_EMPLOYEES = [
  { id: 'e1', organization_id: 'org1', department_id: 'd1', name: 'Suresh Patel', designation: 'Plant Head', contact_number: '+91 98765 43210', joining_date: '2022-03-15', status: 'active', created_at: '2022-03-15T00:00:00Z' },
  { id: 'e2', organization_id: 'org1', department_id: 'd1', name: 'Vikram Singh', designation: 'Machine Operator', contact_number: '+91 98765 43211', joining_date: '2022-06-01', status: 'active', created_at: '2022-06-01T00:00:00Z' },
  { id: 'e3', organization_id: 'org1', department_id: 'd1', name: 'Deepak Yadav', designation: 'Helper', contact_number: '+91 98765 43212', joining_date: '2023-01-10', status: 'active', created_at: '2023-01-10T00:00:00Z' },
  { id: 'e4', organization_id: 'org1', department_id: 'd2', name: 'Manoj Tiwari', designation: 'Supervisor', contact_number: '+91 98765 43213', joining_date: '2022-04-20', status: 'active', created_at: '2022-04-20T00:00:00Z' },
  { id: 'e5', organization_id: 'org1', department_id: 'd2', name: 'Ravi Kumar', designation: 'Craftsman', contact_number: '+91 98765 43214', joining_date: '2022-08-15', status: 'active', created_at: '2022-08-15T00:00:00Z' },
  { id: 'e6', organization_id: 'org1', department_id: 'd3', name: 'Anil Mehta', designation: 'Cutting Operator', contact_number: '+91 98765 43215', joining_date: '2022-05-01', status: 'active', created_at: '2022-05-01T00:00:00Z' },
  { id: 'e7', organization_id: 'org1', department_id: 'd3', name: 'Sanjay Gupta', designation: 'Helper', contact_number: '+91 98765 43216', joining_date: '2023-03-20', status: 'transferred', created_at: '2023-03-20T00:00:00Z' },
  { id: 'e8', organization_id: 'org1', department_id: 'd4', name: 'Prakash Verma', designation: 'Scrap Manager', contact_number: '+91 98765 43217', joining_date: '2022-02-01', status: 'active', created_at: '2022-02-01T00:00:00Z' },
  { id: 'e9', organization_id: 'org1', department_id: 'd5', name: 'Ramesh Chandra', designation: 'Mill Operator', contact_number: '+91 98765 43218', joining_date: '2022-07-10', status: 'active', created_at: '2022-07-10T00:00:00Z' },
  { id: 'e10', organization_id: 'org1', department_id: 'd5', name: 'Karan Bhatt', designation: 'Roller Technician', contact_number: '+91 98765 43219', joining_date: '2023-05-01', status: 'active', created_at: '2023-05-01T00:00:00Z' },
  { id: 'e11', organization_id: 'org1', department_id: 'd6', name: 'Nitin Shah', designation: 'QC Inspector', contact_number: '+91 98765 43220', joining_date: '2023-01-05', status: 'active', created_at: '2023-01-05T00:00:00Z' },
  { id: 'e12', organization_id: 'org1', department_id: 'd1', name: 'Ashok Banerjee', designation: 'Furnace Operator', contact_number: '+91 98765 43221', joining_date: '2021-11-20', status: 'inactive', created_at: '2021-11-20T00:00:00Z' },
];

export const DUMMY_MACHINERY = [
  { id: 'm1', organization_id: 'org1', department_id: 'd1', name: 'Copper Melting Furnace #1', type: 'Furnace', status: 'working', purchase_date: '2021-06-15', notes: 'Primary melting unit', created_at: '2021-06-15T00:00:00Z' },
  { id: 'm2', organization_id: 'org1', department_id: 'd1', name: 'Hydraulic Press A', type: 'Press', status: 'working', purchase_date: '2022-01-10', notes: '', created_at: '2022-01-10T00:00:00Z' },
  { id: 'm3', organization_id: 'org1', department_id: 'd2', name: 'Sheet Bending Machine', type: 'Bending', status: 'maintenance', purchase_date: '2022-03-20', notes: 'Scheduled maintenance due', created_at: '2022-03-20T00:00:00Z' },
  { id: 'm4', organization_id: 'org1', department_id: 'd2', name: 'Spot Welder #1', type: 'Welder', status: 'working', purchase_date: '2022-06-01', notes: '', created_at: '2022-06-01T00:00:00Z' },
  { id: 'm5', organization_id: 'org1', department_id: 'd3', name: 'Circle Cutting Press', type: 'Cutting', status: 'working', purchase_date: '2021-09-15', notes: '', created_at: '2021-09-15T00:00:00Z' },
  { id: 'm6', organization_id: 'org1', department_id: 'd4', name: 'Scrap Shear Cutter', type: 'Cutting', status: 'idle', purchase_date: '2020-12-01', notes: 'Awaiting raw material', created_at: '2020-12-01T00:00:00Z' },
  { id: 'm7', organization_id: 'org1', department_id: 'd5', name: 'Rolling Mill Stand #1', type: 'Rolling', status: 'working', purchase_date: '2021-03-01', notes: 'Core unit', created_at: '2021-03-01T00:00:00Z' },
  { id: 'm8', organization_id: 'org1', department_id: 'd5', name: 'Rolling Mill Stand #2', type: 'Rolling', status: 'maintenance', purchase_date: '2021-03-01', notes: 'Roll replacement needed', created_at: '2021-03-01T00:00:00Z' },
  { id: 'm9', organization_id: 'org1', department_id: 'd6', name: 'Digital Caliper Set', type: 'Measurement', status: 'working', purchase_date: '2023-01-15', notes: '', created_at: '2023-01-15T00:00:00Z' },
];

export const DUMMY_RESOURCES = [
  { id: 'r1', organization_id: 'org1', department_id: 'd1', name: 'Copper Ingots', category: 'Raw Material', quantity: 2500, unit: 'kg', last_updated: '2026-08-20T00:00:00Z' },
  { id: 'r2', organization_id: 'org1', department_id: 'd1', name: 'Flux Powder', category: 'Consumable', quantity: 150, unit: 'kg', last_updated: '2026-08-18T00:00:00Z' },
  { id: 'r3', organization_id: 'org1', department_id: 'd2', name: 'Finished Square Thalis', category: 'Finished Goods', quantity: 3200, unit: 'pcs', last_updated: '2026-08-22T00:00:00Z' },
  { id: 'r4', organization_id: 'org1', department_id: 'd2', name: 'Steel Sheets (2x2)', category: 'Raw Material', quantity: 800, unit: 'sheets', last_updated: '2026-08-19T00:00:00Z' },
  { id: 'r5', organization_id: 'org1', department_id: 'd3', name: 'Copper Discs', category: 'Work-in-Progress', quantity: 5000, unit: 'pcs', last_updated: '2026-08-21T00:00:00Z' },
  { id: 'r6', organization_id: 'org1', department_id: 'd4', name: 'Mixed Scrap Metal', category: 'Scrap', quantity: 1200, unit: 'kg', last_updated: '2026-08-15T00:00:00Z' },
  { id: 'r7', organization_id: 'org1', department_id: 'd5', name: 'Rolled Copper Sheets', category: 'Finished Goods', quantity: 600, unit: 'sheets', last_updated: '2026-08-23T00:00:00Z' },
  { id: 'r8', organization_id: 'org1', department_id: 'd5', name: 'Lubricant Oil', category: 'Consumable', quantity: 45, unit: 'litres', last_updated: '2026-08-10T00:00:00Z' },
  { id: 'r9', organization_id: 'org1', department_id: 'd6', name: 'Testing Reagents', category: 'Consumable', quantity: 30, unit: 'bottles', last_updated: '2026-08-20T00:00:00Z' },
];

export const DUMMY_TRANSFERS = [
  { id: 't1', organization_id: 'org1', item_type: 'employee', item_id: 'e7', item_name: 'Sanjay Gupta', from_department_id: 'd3', from_name: 'Circle Patti Cutting', to_department_id: 'd2', to_name: 'Square Utensils', transferred_by: 'u1', transferred_by_name: 'Rajesh Kumar', reason: 'Skill-based reallocation for utensil pressing', transferred_at: '2026-07-15T10:30:00Z' },
  { id: 't2', organization_id: 'org1', item_type: 'machinery', item_id: 'm6', item_name: 'Scrap Shear Cutter', from_department_id: 'd1', from_name: 'Copper Plant', to_department_id: 'd4', to_name: 'Scrap Department', transferred_by: 'u1', transferred_by_name: 'Rajesh Kumar', reason: 'Repurposed for scrap processing', transferred_at: '2026-06-20T14:00:00Z' },
  { id: 't3', organization_id: 'org1', item_type: 'resource', item_id: 'r4', item_name: 'Steel Sheets (2x2)', from_department_id: 'd5', from_name: 'Rolling Sheet Mill', to_department_id: 'd2', to_name: 'Square Utensils', transferred_by: 'u2', transferred_by_name: 'Amit Sharma', reason: 'Transferring rolled sheets for utensil forming', transferred_at: '2026-08-01T09:15:00Z' },
  { id: 't4', organization_id: 'org1', item_type: 'employee', item_id: 'e3', item_name: 'Deepak Yadav', from_department_id: 'd4', from_name: 'Scrap Department', to_department_id: 'd1', to_name: 'Copper Plant', transferred_by: 'u1', transferred_by_name: 'Rajesh Kumar', reason: 'Promoted to Copper Plant helper role', transferred_at: '2026-05-10T11:00:00Z' },
  { id: 't5', organization_id: 'org1', item_type: 'resource', item_id: 'r1', item_name: 'Copper Ingots', from_department_id: 'd4', from_name: 'Scrap Department', to_department_id: 'd1', to_name: 'Copper Plant', transferred_by: 'u1', transferred_by_name: 'Rajesh Kumar', reason: 'Refined copper sent for melting', transferred_at: '2026-04-22T08:45:00Z' },
];

export const DUMMY_EVENTS = [
  { id: 'ev1', organization_id: 'org1', department_id: null, title: 'Annual Safety Audit', description: 'Mandatory safety compliance audit for all departments', event_date: '2026-09-15', created_by: 'u1', created_by_name: 'Rajesh Kumar', created_at: '2026-08-01T00:00:00Z' },
  { id: 'ev2', organization_id: 'org1', department_id: 'd1', title: 'Furnace Maintenance Shutdown', description: 'Scheduled 3-day shutdown for furnace inspection and cleaning', event_date: '2026-09-05', created_by: 'u2', created_by_name: 'Amit Sharma', created_at: '2026-08-10T00:00:00Z' },
  { id: 'ev3', organization_id: 'org1', department_id: null, title: 'Quarterly Review Meeting', description: 'All department heads report quarterly performance', event_date: '2026-09-30', created_by: 'u1', created_by_name: 'Rajesh Kumar', created_at: '2026-08-15T00:00:00Z' },
  { id: 'ev4', organization_id: 'org1', department_id: 'd5', title: 'Rolling Mill Calibration', description: 'Precision calibration of both rolling mill stands', event_date: '2026-09-10', created_by: 'u1', created_by_name: 'Rajesh Kumar', created_at: '2026-08-12T00:00:00Z' },
  { id: 'ev5', organization_id: 'org1', department_id: 'd6', title: 'New QC Protocol Training', description: 'Training session on updated quality control procedures', event_date: '2026-08-28', created_by: 'u1', created_by_name: 'Rajesh Kumar', created_at: '2026-08-20T00:00:00Z' },
];

export const DUMMY_DOCUMENTS = [
  { id: 'doc1', organization_id: 'org1', department_id: null, title: 'Company Safety Policy 2026', file_url: '#', uploaded_by: 'u1', uploaded_by_name: 'Rajesh Kumar', uploaded_at: '2026-01-10T00:00:00Z' },
  { id: 'doc2', organization_id: 'org1', department_id: null, title: 'Employee Handbook', file_url: '#', uploaded_by: 'u1', uploaded_by_name: 'Rajesh Kumar', uploaded_at: '2026-01-10T00:00:00Z' },
  { id: 'doc3', organization_id: 'org1', department_id: 'd1', title: 'Furnace Operation Manual', file_url: '#', uploaded_by: 'u2', uploaded_by_name: 'Amit Sharma', uploaded_at: '2026-03-15T00:00:00Z' },
  { id: 'doc4', organization_id: 'org1', department_id: 'd5', title: 'Rolling Mill SOP', file_url: '#', uploaded_by: 'u1', uploaded_by_name: 'Rajesh Kumar', uploaded_at: '2026-04-20T00:00:00Z' },
  { id: 'doc5', organization_id: 'org1', department_id: 'd6', title: 'QC Inspection Checklist', file_url: '#', uploaded_by: 'u1', uploaded_by_name: 'Rajesh Kumar', uploaded_at: '2026-05-01T00:00:00Z' },
];

export const CHART_DATA = [
  { month: 'Jan', employees: 10, machinery: 7, resources: 3500 },
  { month: 'Feb', employees: 10, machinery: 8, resources: 4200 },
  { month: 'Mar', employees: 11, machinery: 8, resources: 3800 },
  { month: 'Apr', employees: 12, machinery: 9, resources: 5100 },
  { month: 'May', employees: 12, machinery: 9, resources: 4600 },
  { month: 'Jun', employees: 12, machinery: 9, resources: 4900 },
  { month: 'Jul', employees: 12, machinery: 9, resources: 5300 },
  { month: 'Aug', employees: 12, machinery: 9, resources: 5500 },
];
