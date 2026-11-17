import { Grid, Typography, useMediaQuery, useTheme } from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";

import ContactForm from "../ContactForm/ContactForm";
import { LazyMap } from "./LazyMap";

import "./Contactstyles.css";

export const Contact = () => {
  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <>
      {/* <Banner title="Feel like having a chat or setting up an appointment? We're all ears and here to make it happen with a warm welcome!" /> */}
      <Grid
        container
        flexDirection={"row"}
        alignItems="space-between"
        paddingLeft={sm ? 3 : 5}
        paddingRight={sm ? 3 : 5}
      >
        <Grid item sm={12} md={6}>
          <ContactForm />
        </Grid>
        <Grid
          item
          container
          flexDirection={"column"}
          sm={12}
          md={6}
          spacing={3}
          paddingLeft={sm ? 1 : 5}
          textAlign={sm ? "center" : "left"}
          marginTop={0.75}
        >
          <Grid item>
            <Typography variant="h4">
              CONTACT INFO
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="h6" paddingBottom={1}>
              WORKING HOURS::{" "}
            </Typography>
            <Typography variant="h6">
              <AccessTimeOutlinedIcon className="icon" />
              All days (Monday to Sunday): 11:00 AM - 9:00 PM
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="h6">PHONE: </Typography>
            <Typography variant="h6">
              <PhoneOutlinedIcon className="icon" />
              +91 9347238248
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="h6">EMAIL: </Typography>
            <Typography variant="h6">
              <EmailOutlinedIcon className="icon" />
              smluxesalon@gmail.com
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="h6">ADDRESS: </Typography>
            <Typography variant="h6">
              <PlaceIcon className="icon" />
              <>
                Jain Balaji BigTown Mall, Shop No 304, 3rd Floor<br />
                Safilguda, Malkajgiri, Hyderabad - 500047 (T.S.){" "}
              </>
            </Typography>
          </Grid>
        </Grid>
        <Grid item xs={12} marginTop={10} marginBottom={10}>
          <LazyMap />
        </Grid>
      </Grid>
    </>
  );
};
