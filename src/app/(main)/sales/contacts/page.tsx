import { api } from "@/lib/api.server";
import ContactsClient from "@/modules/sales/contactsClient";

export default async function ContactsPage() {
  const contacts = await api("/api/sales/contacts");

  return <ContactsClient initialContacts={contacts || []} />;
}
