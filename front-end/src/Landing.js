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
          Memorable Moments
        </Typography>
      </div>
      <div className={classes.middleContainer} style={{width: "80%"}}>
        <Typography variant="h3" align="center" style={{marginBottom:16}}>
          Instructions:
        </Typography>
        <Typography variant="h5" style={{marginBottom:16}}>
          First, we will show you a sequence of videos; then, we will test your memory of them.
        </Typography>
        <Typography variant="subtitle-1">
          <b> Part 1: Watch videos.</b> You will watch a sequence of 30-second videos. Please pay careful attention to each video. After each video, you will be asked to write a one-sentence description of what happened in the video.
          <br/><br/>
          <b> Part 2: Memory test.</b> You will watch a sequence of short 3-second video clips. You will see each clip only once. You will be asked to select whether the clip came from a video that you saw in Part 1 or not. 
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
