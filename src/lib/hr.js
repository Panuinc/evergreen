import { supabase } from "./supabase/client";

// ==================== HR Employee CRUD ====================

// ดึงข้อมูลพนักงานทั้งหมด
export async function getEmployees() {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// ดึงข้อมูลพนักงานตาม ID
export async function getEmployeeById(id) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

// สร้างพนักงานใหม่
export async function createEmployee(employeeData) {
  const { data, error } = await supabase
    .from("employees")
    .insert([employeeData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// อัพเดทข้อมูลพนักงาน
export async function updateEmployee(id, employeeData) {
  const { data, error } = await supabase
    .from("employees")
    .update(employeeData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ลบพนักงาน
export async function deleteEmployee(id) {
  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

// ค้นหาพนักงาน
export async function searchEmployees(searchTerm) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// ==================== Departments ====================

export async function getDepartments() {
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

// ==================== Positions ====================

export async function getPositions() {
  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .order("title");

  if (error) throw error;
  return data;
}
