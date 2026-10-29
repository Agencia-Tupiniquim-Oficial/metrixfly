import type { AdminContact } from "@/features/admin/services/admin-api";

export function AdminContactsTable({ contacts }: { contacts: AdminContact[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="bg-muted/40 text-muted-foreground">
            <th scope="col" className="px-6 py-3.5 font-semibold">
              E-mail
            </th>
            <th scope="col" className="px-6 py-3.5 font-semibold">
              Análises
            </th>
            <th scope="col" className="px-6 py-3.5 font-semibold">
              Sites analisados
            </th>
            <th scope="col" className="px-6 py-3.5 font-semibold">
              Última análise
            </th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr
              key={contact.email}
              className="border-t border-border transition-colors hover:bg-muted/30"
            >
              <td className="px-6 py-4 font-bold">
                <a href={`mailto:${contact.email}`} className="hover:text-primary hover:underline">
                  {contact.email}
                </a>
              </td>
              <td className="px-6 py-4">{contact.analyses}</td>
              <td className="max-w-md break-words px-6 py-4 text-muted-foreground">
                {contact.domains.join(", ")}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                {new Date(contact.lastAt).toLocaleString("pt-BR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
