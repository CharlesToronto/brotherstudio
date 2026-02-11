import { site } from "@/content/site";

export default function ContactPage() {
  return (
    <main className="siteMain">
      <address className="contactText">
        {site.contact.addressLines.map((line) => (
          <div key={line}>{line}</div>
        ))}
        <div className="contactSpacer" />
        <div>
          <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
        </div>
        <div>
          <a href={`tel:${site.contact.phone}`}>{site.contact.phone}</a>
        </div>
        <div className="contactSpacer" />
        <div className="contactAccent">{site.contact.openingHours}</div>
      </address>
    </main>
  );
}
