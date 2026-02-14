import { supabase } from "@/lib/supabase/client";

// ==================== HR Employee CRUD ====================

export async function getEmployees() {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("employeeCreatedAt", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getEmployeeById(id) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("employeeId", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createEmployee(employeeData) {
  const { data, error } = await supabase
    .from("employees")
    .insert([employeeData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEmployee(id, employeeData) {
  const { data, error } = await supabase
    .from("employees")
    .update(employeeData)
    .eq("employeeId", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEmployee(id) {
  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("employeeId", id);

  if (error) throw error;
  return true;
}

export async function searchEmployees(searchTerm) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .or(`employeeFirstName.ilike.%${searchTerm}%,employeeLastName.ilike.%${searchTerm}%,employeeEmail.ilike.%${searchTerm}%`)
    .order("employeeCreatedAt", { ascending: false });

  if (error) throw error;
  return data;
}

// ==================== User Linking ====================

export async function getUnlinkedUsers() {
  const { data: allUsers, error: usersError } = await supabase
    .from("userProfiles")
    .select("userProfileId, userProfileEmail")
    .order("userProfileEmail");

  if (usersError) throw usersError;

  const { data: linkedEmployees, error: empError } = await supabase
    .from("employees")
    .select("employeeUserId")
    .not("employeeUserId", "is", null);

  if (empError) throw empError;

  const linkedIds = new Set(linkedEmployees.map((e) => e.employeeUserId));
  return allUsers.filter((u) => !linkedIds.has(u.userProfileId));
}

// ==================== Departments ====================

export async function getDepartments() {
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("departmentName");

  if (error) throw error;
  return data;
}

export async function createDepartment(departmentData) {
  const { data, error } = await supabase
    .from("departments")
    .insert([departmentData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDepartment(id, departmentData) {
  const { data, error } = await supabase
    .from("departments")
    .update(departmentData)
    .eq("departmentId", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDepartment(id) {
  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("departmentId", id);

  if (error) throw error;
  return true;
}

// ==================== Positions ====================

export async function getPositions() {
  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .order("positionTitle");

  if (error) throw error;
  return data;
}

export async function createPosition(positionData) {
  const { data, error } = await supabase
    .from("positions")
    .insert([positionData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePosition(id, positionData) {
  const { data, error } = await supabase
    .from("positions")
    .update(positionData)
    .eq("positionId", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePosition(id) {
  const { error } = await supabase
    .from("positions")
    .delete()
    .eq("positionId", id);

  if (error) throw error;
  return true;
}
