"use client";
import { FormEvent, useState } from "react";
import styles from "./booking-forms.module.css";

export function HallEnquiryForm() {
  const [submitting, setSubmitting] = useState(false); const [message, setMessage] = useState<{ error?: string; success?: string } | null>(null);
  const [minimumDate] = useState(() => new Date().toISOString().slice(0, 10));
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSubmitting(true); setMessage(null); const form=event.currentTarget; const data=new FormData(form); try { const response=await fetch("/api/hall-enquiries",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(data.entries()))}); const result=await response.json() as {error?:string;reference?:string}; if(!response.ok) throw new Error(result.error||"The enquiry could not be sent."); setMessage({success:`Your request has reached our team. Reference ${result.reference}. This is an enquiry, not a confirmed hall booking; the team will contact you to discuss availability and details.`}); form.reset(); } catch(error){setMessage({error:error instanceof Error?error.message:"The enquiry could not be sent."});} finally{setSubmitting(false);} }
  return <form className={styles.form} onSubmit={submit}>
    <div className={styles.grid}>
      <label>Full name<input name="name" autoComplete="name" maxLength={100} required /></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" maxLength={40} required /></label>
      <label className={styles.full}>Email address<input name="email" type="email" autoComplete="email" maxLength={160} required /></label>
      <label>Preferred date<input name="preferredDate" type="date" min={minimumDate} required /></label><label>Alternative date<input name="alternativeDate" type="date" min={minimumDate} /></label>
      <label>Preferred time<input name="preferredTime" maxLength={40} placeholder="Afternoon, 18:00…" /></label><label>Estimated guests<input name="guestCount" type="number" min="1" max="500" inputMode="numeric" /></label>
      <label>Occasion<input name="occasion" maxLength={100} placeholder="Birthday, reception, community event…" /></label><label>Best way to contact<select name="contactPreference" defaultValue="phone"><option value="phone">Phone</option><option value="email">Email</option></select></label>
      <label className={styles.full}>Tell us the basics<textarea name="message" maxLength={1000} required placeholder="What are you planning? Mention catering, layout, stage or accessibility needs if known." /></label>
    </div>
    <label className={styles.consent}><input type="checkbox" required /><span>I understand this is an enquiry. The hall is only confirmed after the restaurant team reviews the request and contacts me.</span></label>
    {message?.error&&<p className={styles.message} role="alert">{message.error}</p>}{message?.success&&<p className={`${styles.message} ${styles.success}`} role="status">{message.success}</p>}
    <button className={styles.button} disabled={submitting}>{submitting?"Sending request…":"Send hall enquiry"}<span aria-hidden="true">→</span></button>
  </form>;
}
