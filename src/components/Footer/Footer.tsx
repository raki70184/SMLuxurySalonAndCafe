import { Grid, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import "./Footer.css";
import { Instagram as InstagramIcon } from "@mui/icons-material";
import { davins, voesh } from "../images/WebsiteImages";
import { CldImage } from "../CldImage";

export const Footer = () => {
  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <footer>
      {/* Main footer content */}
      <Grid
        container
        spacing={4}
        padding={sm ? 4 : 8}
        justifyContent="center"
        className="footerContainer"
      >
        {/* Brand block */}
        <Grid item xs={12} md={4}>
          <Typography className="footerBrand" component="h2">
            SM
            <span> Luxury Salon</span>
          </Typography>
          <Typography className="footerMuted" marginTop={1}>
            Premium salon experience in Hyderabad. Crafted with care.
          </Typography>

          {/* Our Premium Brands */}
          <div className="premiumBrandsSection">
            <Typography className="footerTitle">Our Premium Brands</Typography>
            <div className="brandLogos">
              <CldImage publicId={davins} alt="Davines" width={140} widths={[140, 280]} sizes="140px" />
              <CldImage publicId={voesh} alt="Voesh" width={180} widths={[180, 360]} sizes="180px" />
            </div>
          </div>

          {/* Developer credit */}
          <Typography className="devCredit">
            Website Design by{' '}
            <a 
              href="https://oneklickai.net/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="developer"
            >
              OneKlick AI
            </a>
          </Typography>

          {/* Instagram follow */}
          <Typography className="instaRow" marginTop={1.5}>
            Follow along on {" "}
            <a
              target="_blank"
              href="https://instagram.com/sm.luxe_?igshid=MzRlODBiNWFlZA=="
              rel="noreferrer"
            >
              Instagram
            </a>{" "}
            <InstagramIcon className="instaIcon" />
          </Typography>
        </Grid>

        {/* Links */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography className="footerTitle">Links</Typography>
          <ul className="footerList">
            <li><a href="/about">About</a></li>
            <li><a href="/services">Services</a></li>
            <li><a href="/gallery">Gallery</a></li>
            <li><a href="/cafe">Cafe</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Grid>

        {/* Contact */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography className="footerContact">Contact</Typography>
          <Typography className="footerMuted">
            Jain Balaji BigTown Mall, Shop No 304, 3rd Floor
            <br />Safilguda, Malkajgiri, Hyderabad - 500047 (T.S.)
          </Typography>
          <Typography className="footerLine"><strong>Phone:</strong> <a href="tel:+919347238248">+91 93472 38248</a></Typography>
          <Typography className="footerLine"><strong>Email:</strong> <a href="mailto:smluxesalon@gmail.com">smluxesalon@gmail.com</a></Typography>
          <Typography className="footerLine"><strong>Business Hours:</strong> All days (Mon–Sun): 11:00 AM – 9:00 PM</Typography>
        </Grid>
      </Grid>

      {/* Bottom legal bar */}
      <Grid container className="footerBottom" justifyContent="space-between" padding={sm ? 2 : 3}>
        <Grid item>
          <a href="#">PRIVACY POLICY</a> <span className="dot">•</span> <a href="#">TERMS & CONDITIONS</a>
        </Grid>
        <Grid item className="footerCredit">
          © {new Date().getFullYear()} SM Luxury Salon
        </Grid>
      </Grid>
    </footer>
  );
};
