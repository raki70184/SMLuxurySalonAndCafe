import React, { useRef, useState } from "react";
import {
  Alert,
  Grid,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LoadingButton } from "@mui/lab";
import dayjs, { type Dayjs } from "dayjs";

import { PostDetailsUrl } from "../utils/constants";
import { describeSource, getAttribution, trackEvent } from "../../lib/tracking";

import "./ContactForm.css"; // Import the CSS file for styles

interface FormData {
  name: string;
  phone: string;
  email: string;
  message: string;
  schedule: Dayjs | null;
}

const SALON_PHONE_DISPLAY = "+91 93472 38248";
const SALON_PHONE_TEL = "+919347238248";
const SALON_WHATSAPP = "https://wa.me/919347238248";
const SALON_INSTAGRAM = "https://instagram.com/sm.luxe_";
const SALON_EMAIL = "smluxesalon@gmail.com";
const SALON_HOURS = "Open all days, 11:00 AM – 9:00 PM";

const initialFormData: FormData = {
  name: "",
  phone: "",
  email: "",
  message: "",
  schedule: null,
};

const ContactForm: React.FC = () => {
  const form = useRef<HTMLFormElement>(
    null
  ) as React.MutableRefObject<HTMLFormElement>;
  const [submitted, setSubmitted] = useState(false);
  // Holds the failure message so a rejected submit is visible instead of silent.
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  // Snapshot of what was sent, so the confirmation can echo the name + date.
  const [confirmed, setConfirmed] = useState<{ name: string; date: string | null } | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-digit characters from the input
    const sanitizedInput = e.target.value.replace(/\D/g, '');

    // Check if the input is a number and has a length of 10
    if (/^\d{0,10}$/.test(sanitizedInput)) {
      setFormData({ ...formData, phone: sanitizedInput });
    }
  };
  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.down("sm"));
  const submitHanlder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    const payload = new FormData(form.current);
    // Human-readable date for the salon's email + sheet (the picker's raw value is MM/DD/YYYY).
    const visitDate = formData.schedule ? dayjs(formData.schedule).format("ddd, D MMM YYYY") : null;
    payload.set("schedule", visitDate ?? "");
    payload.set("page", typeof window !== "undefined" ? window.location.href : "");
    // How this visitor reached the site (Google Ads click, utm tags, landing page).
    const attribution = getAttribution();
    const source = describeSource(attribution);
    payload.set("source", source);
    for (const [key, value] of Object.entries(attribution)) {
      if (value) payload.set(key, value);
    }
    fetch(form.current.action, {
      method: form.current.method,
      body: payload,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        // GA4 lead conversion: mark generate_lead as a key event and import into Google Ads.
        trackEvent("generate_lead", {
          form_id: "contact-form",
          lead_source: source,
          has_visit_date: Boolean(visitDate),
        });
        setConfirmed({ name: formData.name.trim().split(/\s+/)[0] || "", date: visitDate });
        setSubmitted(true);
        setFormData(initialFormData);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        setErrorMessage(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      });
  };

  return (
    <>
      {submitted ? (
        <Grid
          container
          flexDirection={"column"}
          alignItems={"center"}
          textAlign={"center"}
          spacing={2}
          marginTop={2}
          padding={2}
          className="contact-confirmation"
          data-track-location="form_confirmation"
        >
          <Grid item>
            <Alert severity="success">
              {confirmed?.name ? `Thank you, ${confirmed.name}! ` : "Thank you! "}
              We've received your visit request
              {confirmed?.date ? ` for ${confirmed.date}` : ""}.
            </Alert>
          </Grid>
          <Grid item>
            <Typography variant="body1">
              Our team will call or WhatsApp you shortly to confirm your time
              slot. A copy of your request has been sent to your email.
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="body1" fontWeight={600}>
              Need to change the date, time or service? Reach us any way you like:
            </Typography>
          </Grid>
          <Grid item>
            <ul className="confirmation-contacts">
              <li>
                Call: <a href={`tel:${SALON_PHONE_TEL}`}>{SALON_PHONE_DISPLAY}</a>
              </li>
              <li>
                WhatsApp:{" "}
                <a href={SALON_WHATSAPP} target="_blank" rel="noopener noreferrer">
                  message us on WhatsApp
                </a>
              </li>
              <li>
                Instagram DM:{" "}
                <a href={SALON_INSTAGRAM} target="_blank" rel="noopener noreferrer" className="instagram">
                  @sm.luxe_
                </a>
              </li>
              <li>Live chat: tap the chat bubble at the bottom-right of this page</li>
              <li>
                Email: <a href={`mailto:${SALON_EMAIL}`}>{SALON_EMAIL}</a>
              </li>
            </ul>
          </Grid>
          <Grid item>
            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
              {SALON_HOURS} · Jain Balaji BigTown Mall, Shop 304, 3rd Floor,
              Safilguda, Malkajgiri
            </Typography>
          </Grid>
        </Grid>
      ) : (
        <Grid
          container
          flexDirection={"row"}
          padding={2}
          textAlign={sm ? "center" : "left"}
        >
          <Grid item>
            <Typography variant="h3">Let's Get in Touch!</Typography>
          </Grid>
          <Grid item>
            <Typography variant="body1" marginTop={2} marginBottom={2}>
              We're here to help you look and feel your best. Contact us with
              any questions, to schedule an appointment, or to provide feedback.
            </Typography>
          </Grid>
          <form
            id="contact-form"
            style={{ width: "100%" }}
            ref={form}
            action={PostDetailsUrl}
            method="POST"
            onSubmit={submitHanlder}
          >
            <Grid
              item
              container
              flexDirection={"column"}
              marginTop={2}
              className="contact-form"
              paddingRight={sm ? 0 : 2}
            >
              <Grid container flexDirection={"row"}>
                <Grid
                  item
                  xs={12}
                  sm={6}
                  paddingRight={sm ? 0 : 2}
                  paddingBottom={sm ? 2 : 0}
                >
                  <TextField
                    required
                    fullWidth
                    id="outlined-required"
                    label="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    id="outlined-required"
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    type="tel"
                  />
                </Grid>
              </Grid>
              <Grid container flexDirection={"row"}>
                <Grid
                  item
                  xs={12}
                  sm={6}
                  paddingRight={sm ? 0 : 2}
                  paddingBottom={sm ? 2 : 0}
                >
                  <TextField
                    required
                    fullWidth
                    id="outlined-required"
                    label="Email"
                    name="email"
                    value={formData.email}
                    type="email"
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      slotProps={{
                        textField: {
                          inputProps: {
                            name: "schedule",
                          },
                        },
                      }}
                      label="Appointment Date"
                      disablePast
                      value={formData.schedule}
                      sx={{ width: "100%" }}
                      onChange={(e) =>
                        setFormData({ ...formData, schedule: e })
                      }
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
              <Grid item>
                <TextField
                  id="outlined-multiline-flexible"
                  label="Comment"
                  multiline
                  name="message"
                  rows={3}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  fullWidth
                />
              </Grid>
              {errorMessage && (
                <Grid item marginTop={2}>
                  <Alert severity="error" sx={{ fontStyle: "italic" }}>
                    Sorry, we couldn't submit that. Please try again or DM us on
                    Instagram. ({errorMessage})
                  </Alert>
                </Grid>
              )}
              <Grid item marginTop={2} className="appointment">
                <LoadingButton
                  type="submit"
                  variant="contained"
                  sx={{ borderRadius: "10px" }}
                  fullWidth={sm}
                  loading={isLoading}
                  loadingIndicator="Submitting..."
                  size="large"
                >
                  Schedule Your Visit
                </LoadingButton>
              </Grid>
            </Grid>
          </form>
        </Grid>
      )}
    </>
  );
};

export default ContactForm;
