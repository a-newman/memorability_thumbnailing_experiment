import React from "react";
import { makeStyles } from '@material-ui/core/styles';
import { Button, Typography } from '@material-ui/core';
import { Link } from "react-router-dom";

const useStyles = makeStyles({
  root: {
    display: 'flex',
    minHeight: '100vh',
    width: '100vw',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    padding: 16,
  },
  topContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  startButton: {
    borderRadius: 16,
    fontSize: 36,
    width: 570,
    paddingLeft: 32,
    paddingRight: 32,
  },
});

export default function Landing(props) {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <div className={classes.topContainer}>
        <Typography variant="h2" style={{marginBottom: 16}}>
          Most Memorable Moment
        </Typography>
      </div>
      <div className={classes.middleContainer}>
        <Typography variant="subtitle1" align="center">
          <b>Instructions:</b>
          <br />
          You will be shown a stream of videos.
        </Typography>
      </div>
      <div className={classes.bottomContainer}>
        <Link to={{pathname:"/interface", search: props.location.search}}>
          <Button variant="contained" size="large" className={classes.startButton}>
            Start
          </Button>
        </Link>
      </div>
    </div>
  );
}