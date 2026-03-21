import { api } from "@/lib/api.server";
import ContactsClient from "@/modules/sales/contactsClient";
import type { SalesContact } from "@/modules/sales/types";

export default async function ContactsPage() {
  const contacts = await api<SalesContact[]>("/api/sales/contacts");

  return <ContactsClient initialContacts={contacts || []} />;
}
