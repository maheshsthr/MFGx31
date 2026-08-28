export const DUMMY_USER_ADMIN = {
  id: 'u1',
  full_name: 'Rajesh Kumar',
  email: 'rajesh@texfab.in',
  role: 'admin',
  organization_id: 'org1',
  department_id: null,
  avatar_url: null,
};

export const DUMMY_USER_DEPT_HEAD = {
  id: 'u2',
  full_name: 'Amit Sharma',
  email: 'amit@texfab.in',
  role: 'department_head',
  organization_id: 'org1',
  department_id: 'd1',
  avatar_url: null,
};

export const DUMMY_ORG = {
  id: 'org1',
  name: 'TexFab Mills',
  industry_type: 'Textile Manufacturing',
  logo_url: null,
  ownership_type: 'partnership',
  created_at: '2024-01-15T00:00:00Z',
};

export const DUMMY_OWNERS = [
  { id: 'own1', organization_id: 'org1', full_name: 'Rajesh Kumar', email: 'rajesh@texfab.in', phone: '+91 98765 43200', ownership_share: 60, role: 'Managing Partner', joined_date: '2024-01-15', is_primary: true },
  { id: 'own2', organization_id: 'org1', full_name: 'Sunita Devi', email: 'sunita@texfab.in', phone: '+91 98765 43201', ownership_share: 25, role: 'Partner', joined_date: '2024-01-15', is_primary: false },
  { id: 'own3', organization_id: 'org1', full_name: 'Vikram Malhotra', email: 'vikram@texfab.in', phone: '+91 98765 43202', ownership_share: 15, role: 'Partner', joined_date: '2024-06-01', is_primary: false },
];

export const DUMMY_DEPARTMENTS = [
  { id: 'd1', organization_id: 'org1', name: 'Spinning', description: 'Cotton fibre spinning & yarn production', head_profile_id: 'u2', created_at: '2024-01-20T00:00:00Z' },
  { id: 'd2', organization_id: 'org1', name: 'Weaving', description: 'Fabric weaving on power looms', head_profile_id: null, created_at: '2024-01-22T00:00:00Z' },
  { id: 'd3', organization_id: 'org1', name: 'Dyeing & Printing', description: 'Fabric coloring and pattern printing', head_profile_id: null, created_at: '2024-02-01T00:00:00Z' },
  { id: 'd4', organization_id: 'org1', name: 'Knitting', description: 'Circular knitting for knit fabrics', head_profile_id: null, created_at: '2024-02-05T00:00:00Z' },
  { id: 'd5', organization_id: 'org1', name: 'Cutting & Stitching', description: 'Garment cutting and assembly', head_profile_id: null, created_at: '2024-02-10T00:00:00Z' },
  { id: 'd6', organization_id: 'org1', name: 'Quality Control', description: 'Final inspection and quality assurance', head_profile_id: null, created_at: '2024-03-01T00:00:00Z' },
];

export const DUMMY_EMPLOYEES = [
  { id: 'e1', organization_id: 'org1', department_id: 'd1', name: 'Suresh Patel', designation: 'Spinning Supervisor', contact_number: '+91 98765 43210', joining_date: '2022-03-15', status: 'active', created_at: '2022-03-15T00:00:00Z' },
  { id: 'e2', organization_id: 'org1', department_id: 'd1', name: 'Vikram Singh', designation: 'Spinner', contact_number: '+91 98765 43211', joining_date: '2022-06-01', status: 'active', created_at: '2022-06-01T00:00:00Z' },
  { id: 'e3', organization_id: 'org1', department_id: 'd1', name: 'Deepak Yadav', designation: 'Yarn Technician', contact_number: '+91 98765 43212', joining_date: '2023-01-10', status: 'active', created_at: '2023-01-10T00:00:00Z' },
  { id: 'e4', organization_id: 'org1', department_id: 'd2', name: 'Manoj Tiwari', designation: 'Loom Operator', contact_number: '+91 98765 43213', joining_date: '2022-04-20', status: 'active', created_at: '2022-04-20T00:00:00Z' },
  { id: 'e5', organization_id: 'org1', department_id: 'd2', name: 'Ravi Kumar', designation: 'Weaver', contact_number: '+91 98765 43214', joining_date: '2022-08-15', status: 'active', created_at: '2022-08-15T00:00:00Z' },
  { id: 'e6', organization_id: 'org1', department_id: 'd3', name: 'Anil Mehta', designation: 'Dyeing Operator', contact_number: '+91 98765 43215', joining_date: '2022-05-01', status: 'active', created_at: '2022-05-01T00:00:00Z' },
  { id: 'e7', organization_id: 'org1', department_id: 'd3', name: 'Sanjay Gupta', designation: 'Printer', contact_number: '+91 98765 43216', joining_date: '2023-03-20', status: 'transferred', created_at: '2023-03-20T00:00:00Z' },
  { id: 'e8', organization_id: 'org1', department_id: 'd4', name: 'Prakash Verma', designation: 'Knitting Technician', contact_number: '+91 98765 43217', joining_date: '2022-02-01', status: 'active', created_at: '2022-02-01T00:00:00Z' },
  { id: 'e9', organization_id: 'org1', department_id: 'd5', name: 'Ramesh Chandra', designation: 'Tailor', contact_number: '+91 98765 43218', joining_date: '2022-07-10', status: 'active', created_at: '2022-07-10T00:00:00Z' },
  { id: 'e10', organization_id: 'org1', department_id: 'd5', name: 'Karan Bhatt', designation: 'Cutting Master', contact_number: '+91 98765 43219', joining_date: '2023-05-01', status: 'active', created_at: '2023-05-01T00:00:00Z' },
  { id: 'e11', organization_id: 'org1', department_id: 'd6', name: 'Nitin Shah', designation: 'QC Inspector', contact_number: '+91 98765 43220', joining_date: '2023-01-05', status: 'active', created_at: '2023-01-05T00:00:00Z' },
  { id: 'e12', organization_id: 'org1', department_id: 'd1', name: 'Ashok Banerjee', designation: 'Carding Operator', contact_number: '+91 98765 43221', joining_date: '2021-11-20', status: 'inactive', created_at: '2021-11-20T00:00:00Z' },
];

export const DUMMY_MACHINERY = [
  { id: 'm1', organization_id: 'org1', department_id: 'd1', name: 'Ring Spinning Frame #1', type: 'Spinning', status: 'working', purchase_date: '2021-06-15', notes: 'Primary yarn production unit', created_at: '2021-06-15T00:00:00Z' },
  { id: 'm2', organization_id: 'org1', department_id: 'd1', name: 'Carding Machine A', type: 'Carding', status: 'working', purchase_date: '2022-01-10', notes: '', created_at: '2022-01-10T00:00:00Z' },
  { id: 'm3', organization_id: 'org1', department_id: 'd2', name: 'Power Loom #3', type: 'Loom', status: 'maintenance', purchase_date: '2022-03-20', notes: 'Scheduled maintenance due', created_at: '2022-03-20T00:00:00Z' },
  { id: 'm4', organization_id: 'org1', department_id: 'd2', name: 'Rapier Loom #1', type: 'Loom', status: 'working', purchase_date: '2022-06-01', notes: '', created_at: '2022-06-01T00:00:00Z' },
  { id: 'm5', organization_id: 'org1', department_id: 'd3', name: 'Jet Dyeing Machine', type: 'Dyeing', status: 'working', purchase_date: '2021-09-15', notes: '', created_at: '2021-09-15T00:00:00Z' },
  { id: 'm6', organization_id: 'org1', department_id: 'd3', name: 'Screen Printing Press', type: 'Printing', status: 'idle', purchase_date: '2020-12-01', notes: 'Awaiting dye consignment', created_at: '2020-12-01T00:00:00Z' },
  { id: 'm7', organization_id: 'org1', department_id: 'd4', name: 'Circular Knitting Machine #1', type: 'Knitting', status: 'working', purchase_date: '2021-03-01', notes: 'Core unit', created_at: '2021-03-01T00:00:00Z' },
  { id: 'm8', organization_id: 'org1', department_id: 'd4', name: 'Circular Knitting Machine #2', type: 'Knitting', status: 'maintenance', purchase_date: '2021-03-01', notes: 'Needle replacement needed', created_at: '2021-03-01T00:00:00Z' },
  { id: 'm9', organization_id: 'org1', department_id: 'd6', name: 'Fabric Inspection Table', type: 'Inspection', status: 'working', purchase_date: '2023-01-15', notes: '', created_at: '2023-01-15T00:00:00Z' },
];

export const DUMMY_RESOURCES = [
  { id: 'r1', organization_id: 'org1', department_id: 'd1', name: 'Raw Cotton Bales', category: 'Raw Material', quantity: 120, unit: 'bales', last_updated: '2026-08-20T00:00:00Z' },
  { id: 'r2', organization_id: 'org1', department_id: 'd1', name: 'Greige Yarn', category: 'Work-in-Progress', quantity: 4500, unit: 'kg', last_updated: '2026-08-18T00:00:00Z' },
  { id: 'r3', organization_id: 'org1', department_id: 'd2', name: 'Woven Fabric Rolls', category: 'Finished Goods', quantity: 820, unit: 'rolls', last_updated: '2026-08-22T00:00:00Z' },
  { id: 'r4', organization_id: 'org1', department_id: 'd2', name: 'Spare Shuttles', category: 'Consumable', quantity: 40, unit: 'pcs', last_updated: '2026-08-19T00:00:00Z' },
  { id: 'r5', organization_id: 'org1', department_id: 'd3', name: 'Reactive Dyes', category: 'Raw Material', quantity: 260, unit: 'kg', last_updated: '2026-08-21T00:00:00Z' },
  { id: 'r6', organization_id: 'org1', department_id: 'd4', name: 'Knit Fabric Rolls', category: 'Work-in-Progress', quantity: 540, unit: 'rolls', last_updated: '2026-08-15T00:00:00Z' },
  { id: 'r7', organization_id: 'org1', department_id: 'd5', name: 'Finished Garments', category: 'Finished Goods', quantity: 3200, unit: 'pcs', last_updated: '2026-08-23T00:00:00Z' },
  { id: 'r8', organization_id: 'org1', department_id: 'd5', name: 'Sewing Thread', category: 'Consumable', quantity: 600, unit: 'cones', last_updated: '2026-08-10T00:00:00Z' },
  { id: 'r9', organization_id: 'org1', department_id: 'd6', name: 'Color Fastness Kits', category: 'Consumable', quantity: 25, unit: 'kits', last_updated: '2026-08-20T00:00:00Z' },
];

export const DUMMY_TRANSFERS = [
  { id: 't1', organization_id: 'org1', item_type: 'employee', item_id: 'e7', item_name: 'Sanjay Gupta', from_department_id: 'd3', from_name: 'Dyeing & Printing', to_department_id: 'd2', to_name: 'Weaving', transferred_by: 'u1', transferred_by_name: 'Rajesh Kumar', reason: 'Skill-based reallocation for loom side', transferred_at: '2026-07-15T10:30:00Z' },
  { id: 't2', organization_id: 'org1', item_type: 'machinery', item_id: 'm6', item_name: 'Screen Printing Press', from_department_id: 'd3', from_name: 'Dyeing & Printing', to_department_id: 'd5', to_name: 'Cutting & Stitching', transferred_by: 'u1', transferred_by_name: 'Rajesh Kumar', reason: 'Repurposed for marker printing', transferred_at: '2026-06-20T14:00:00Z' },
  { id: 't3', organization_id: 'org1', item_type: 'resource', item_id: 'r4', item_name: 'Spare Shuttles', from_department_id: 'd2', from_name: 'Weaving', to_department_id: 'd4', to_name: 'Knitting', transferred_by: 'u2', transferred_by_name: 'Amit Sharma', reason: 'Sharing spare shuttles with knitting', transferred_at: '2026-08-01T09:15:00Z' },
  { id: 't4', organization_id: 'org1', item_type: 'employee', item_id: 'e3', item_name: 'Deepak Yadav', from_department_id: 'd1', from_name: 'Spinning', to_department_id: 'd3', to_name: 'Dyeing & Printing', transferred_by: 'u1', transferred_by_name: 'Rajesh Kumar', reason: 'Cross-trained for dyeing ops', transferred_at: '2026-05-10T11:00:00Z' },
  { id: 't5', organization_id: 'org1', item_type: 'resource', item_id: 'r1', item_name: 'Raw Cotton Bales', from_department_id: 'd4', from_name: 'Knitting', to_department_id: 'd1', to_name: 'Spinning', transferred_by: 'u1', transferred_by_name: 'Rajesh Kumar', reason: 'Cotton forwarded for spinning', transferred_at: '2026-04-22T08:45:00Z' },
];

export const DUMMY_EVENTS = [
  { id: 'ev1', organization_id: 'org1', department_id: null, title: 'Annual Safety Audit', description: 'Mandatory safety compliance audit for all departments', event_date: '2026-09-15', created_by: 'u1', created_by_name: 'Rajesh Kumar', created_at: '2026-08-01T00:00:00Z' },
  { id: 'ev2', organization_id: 'org1', department_id: 'd1', title: 'Spinning Frame Maintenance', description: 'Scheduled shutdown for ring spinning frame inspection', event_date: '2026-09-05', created_by: 'u2', created_by_name: 'Amit Sharma', created_at: '2026-08-10T00:00:00Z' },
  { id: 'ev3', organization_id: 'org1', department_id: null, title: 'Quarterly Review Meeting', description: 'All department heads report quarterly performance', event_date: '2026-09-30', created_by: 'u1', created_by_name: 'Rajesh Kumar', created_at: '2026-08-15T00:00:00Z' },
  { id: 'ev4', organization_id: 'org1', department_id: 'd4', title: 'Knitting Machine Calibration', description: 'Precision calibration of circular knitting machines', event_date: '2026-09-10', created_by: 'u1', created_by_name: 'Rajesh Kumar', created_at: '2026-08-12T00:00:00Z' },
  { id: 'ev5', organization_id: 'org1', department_id: 'd6', title: 'New QC Protocol Training', description: 'Training session on updated quality control procedures', event_date: '2026-08-28', created_by: 'u1', created_by_name: 'Rajesh Kumar', created_at: '2026-08-20T00:00:00Z' },
];

export const DUMMY_DOCUMENTS = [
  { id: 'doc1', organization_id: 'org1', department_id: null, title: 'Company Safety Policy 2026', file_url: '#', uploaded_by: 'u1', uploaded_by_name: 'Rajesh Kumar', uploaded_at: '2026-01-10T00:00:00Z' },
  { id: 'doc2', organization_id: 'org1', department_id: null, title: 'Employee Handbook', file_url: '#', uploaded_by: 'u1', uploaded_by_name: 'Rajesh Kumar', uploaded_at: '2026-01-10T00:00:00Z' },
  { id: 'doc3', organization_id: 'org1', department_id: 'd1', title: 'Ring Spinning Operation Manual', file_url: '#', uploaded_by: 'u2', uploaded_by_name: 'Amit Sharma', uploaded_at: '2026-03-15T00:00:00Z' },
  { id: 'doc4', organization_id: 'org1', department_id: 'd2', title: 'Power Loom SOP', file_url: '#', uploaded_by: 'u1', uploaded_by_name: 'Rajesh Kumar', uploaded_at: '2026-04-20T00:00:00Z' },
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
