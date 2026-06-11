"use client";

import { useState } from "react";
import { Button, Input, Switch, TextArea, TextField } from "@heroui/react";
import { Envelope, MapPin, Smartphone } from "@gravity-ui/icons";
import { Container } from "@/app/components/ui/Container";
import { Section } from "@/app/components/ui/Section";
import { Heading, Text } from "@/app/components/ui/Typography";
import { AppLink as Link } from "@/app/components/ui/AppLink";

const FIELD_CLASS =
  "w-full rounded-lg border border-transparent bg-surface-secondary px-4 py-3 text-base text-foreground transition-colors placeholder:text-muted focus-within:border-accent";

type ContactInfo = {
  icon: React.ReactNode;
  title: string;
  detail: string;
  href?: string;
};

const CONTACT_INFO: ContactInfo[] = [
  {
    icon: <Smartphone className="size-5" />,
    title: "Phone Number",
    detail: "(555) 123-4567-8901",
    href: "tel:+15551234567",
  },
  {
    icon: <Envelope className="size-5" />,
    title: "Email Address",
    detail: "support@energiebee.com",
    href: "mailto:support@energiebee.com",
  },
  {
    icon: <MapPin className="size-5" />,
    title: "Location",
    detail: "123 Sunnyvale Park, Springfield, IL, USA",
  },
];

const MAP_SRC =
  "https://www.google.com/maps?q=Old+Trafford,+Manchester,+UK&output=embed";

/**
 * Get-in-touch section — eyebrow + title, a multi-field enquiry form, a row of
 * contact-info cards, and an embedded map. Light surface to follow the dark
 * hero. The form is controlled for state only; submit is a no-op until wired
 * to a server action / API route.
 */
export default function GetInTouch() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: wire to server action / API route / form handler
    console.log({
      firstName,
      lastName,
      email,
      phone,
      company,
      message,
      agreed,
    });
  };

  return (
    <Section spacing="lg" surface="base">
      <Container size="wide">
        {/* heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Contact
          </p>
          <Heading variant="title" className="mt-2 text-foreground">
            Get in touch
          </Heading>
          <Text variant="lead" tone="muted" className="mt-3">
            Reach out to us anytime! We&rsquo;re here to help with your
            inquiries and support.
          </Text>
        </div>

        {/* form */}
        <form
          onSubmit={onSubmit}
          className="mx-auto mt-12 flex max-w-2xl flex-col gap-5"
        >
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-4 text-sm font-bold text-foreground">
              Personal Information
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                aria-label="First Name"
                value={firstName}
                onChange={setFirstName}
                isRequired
              >
                <Input placeholder="First Name" className={FIELD_CLASS} />
              </TextField>
              <TextField
                aria-label="Last Name"
                value={lastName}
                onChange={setLastName}
                isRequired
              >
                <Input placeholder="Last Name" className={FIELD_CLASS} />
              </TextField>
            </div>
            <TextField
              aria-label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              isRequired
            >
              <Input placeholder="Email" className={FIELD_CLASS} />
            </TextField>
            <TextField
              aria-label="Phone"
              type="tel"
              value={phone}
              onChange={setPhone}
            >
              <Input placeholder="Phone" className={FIELD_CLASS} />
            </TextField>
            <TextField
              aria-label="Company"
              value={company}
              onChange={setCompany}
            >
              <Input placeholder="Company" className={FIELD_CLASS} />
            </TextField>
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 text-sm font-bold text-foreground">
              Purposes
            </legend>
            <TextArea
              aria-label="Message"
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className={`${FIELD_CLASS} resize-none`}
            />
          </fieldset>

          <Switch
            isSelected={agreed}
            onChange={setAgreed}
            className="items-center gap-3"
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Content>
              <span className="text-sm text-muted">
                By selecting this, you agree to our{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-accent underline"
                >
                  privacy policy.
                </Link>
              </span>
            </Switch.Content>
          </Switch>

          <Button
            type="submit"
            isDisabled={!agreed}
            className="w-full rounded-lg bg-accent py-3 text-base font-semibold text-white shadow-[0_15px_30px_-10px_rgba(238,61,26,0.6)] transition hover:brightness-110"
          >
            Send Message
          </Button>
        </form>

        {/* contact info cards */}
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3">
          {CONTACT_INFO.map((item) => {
            const detail = item.href ? (
              <Link
                href={item.href}
                className="text-sm text-muted transition-colors hover:text-accent"
              >
                {item.detail}
              </Link>
            ) : (
              <span className="text-sm text-muted">{item.detail}</span>
            );
            return (
              <div
                key={item.title}
                className="flex flex-col items-center rounded-2xl bg-surface-secondary px-6 py-8 text-center"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  {item.icon}
                </span>
                <h3 className="mt-4 text-base font-bold text-foreground">
                  {item.title}
                </h3>
                <div className="mt-1">{detail}</div>
              </div>
            );
          })}
        </div>

        {/* map */}
        <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-2xl border border-border">
          <iframe
            src={MAP_SRC}
            title="EnergieBee location map"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-75 w-full sm:h-96"
            allowFullScreen
          />
        </div>
      </Container>
    </Section>
  );
}
