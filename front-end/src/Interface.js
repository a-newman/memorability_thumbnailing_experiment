import React, { Component } from 'react';
import { withStyles, MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import $ from 'jquery';
import { Button, TextField, Typography } from '@material-ui/core';
import { Progress } from 'react-sweet-progress';
import "react-sweet-progress/lib/style.css";

import data from "./test.json";

const MTURK_SUBMIT_SUFFIX = "/mturk/externalSubmit";

const THEME = createMuiTheme({
  typography: {
   "fontFamily": "'Raleway', sans-serif",
   "fontSize": 14,
   "fontWeightLight": 100,
   "fontWeightRegular": 100,
   "fontWeightMedium": 100
  }
});

const styles = theme => ({
  root: {
    display: 'flex',
    minHeight: '100vh',
    width: '100vw',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    padding: 16,
  },
  buttonsContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 16,
  },
  countdownTimer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  irb: {
    width: "70%",
    textAlign: "center",
    padding: 16,
  },
  leftButton: {
    borderRadius: 16,
    fontSize: 24,
    marginRight: 8,
  },
  levelProgress: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  rightButton: {
    borderRadius: 16,
    fontSize: 24,
    marginLeft: 8,
  },
  textField: {
    minWidth: 256,
    width: "50%",
    marginBottom: 16,
  },
  textFieldContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  textSubmitButton: {
    borderRadius: 16,
    fontSize: 24,
    margin: 8,
  },
  topSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  videoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
});

class Interface extends Component {
  constructor(props) {
    super(props);
    this.state = {
      completed: false,
      countdown: false,
      cropSection: false,
      cropVideos: data["crops"],
      currentIndex: 0,
      data: data,
      disableButton: true,
      filename: "",
      longVideos: data["long_videos"],
      percent: 0,
      results: {"video_captions": [], "crop_choice": []},
      textFieldButtonText: "Next",
      textInput: "",
      timer: Date.now(),
      videoEnded: false,
      videoEnded2: false,
      videoSize: 480,
    };

    this.videoRef = React.createRef();

    this._setVideoEnded = this._setVideoEnded.bind(this);
    this._setVideoEnded2 = this._setVideoEnded2.bind(this);
    this._submitHITform = this._submitHITform.bind(this);
    this._handleTextChange = this._handleTextChange.bind(this);
    this._handleButtonClick = this._handleButtonClick.bind(this);
    this._loadNextVideo = this._loadNextVideo.bind(this);
    this._seenVideoClip = this._seenVideoClip.bind(this);
    this._notSeenVideoClip = this._notSeenVideoClip.bind(this);
    this._completeCountdown = this._completeCountdown.bind(this);
  
  }

  componentDidMount() {
    var url = window.location.href;
    var identifier = "data";
    if (url.indexOf(identifier) > 0) {
      var file = this._gup(identifier);
      var data = require('./' + file + '.json');
      this.setState({
        longVideos: data["long_videos"],
        cropVideos: data["crops"],
        percent: 0,
        data: data,
        filename: file,
      })
    }

    // Video stuff
    const vid = this.videoRef.current;
    vid.addEventListener('ended', this._setVideoEnded, false)
  }

  _setVideoEnded() {
    this.setState({
      videoEnded: true,
    })
  }

  _setVideoEnded2() {
    this.setState({
      videoEnded2: true,
    })
  }

  _handleButtonClick() {
    if (this.state.textFieldButtonText === "Next") {
      this._loadNextVideo();
    } else if (this.state.textFieldButtonText == "Continue to Next Section") {
      this.setState({
        countdown: true,
        videoEnded: false,
        cropSection: true,
        currentIndex: 0,
        percent: 0,
      });
    }
  }

  _loadNextVideo() {
    if (this.state.textInput.split(" ").length < 8) {
      alert("Please enter a description of the video before continuing with at least 8 words.");
      return;
    }
    this.setState({
      percent: Math.min(this.state.percent + 100/this.state.longVideos.length, 100),
    })
    this.state.results["video_captions"].push(this.state.textInput);
    if (this.state.currentIndex === this.state.longVideos.length - 1) {
      this.setState({
        textFieldButtonText: "Continue to Next Section",
      });
      return;
    }
    this.setState({
      videoEnded: false,
      currentIndex: this.state.currentIndex + 1,
      textInput: "",
    }, () => {
       // Video stuff
      const vid = this.videoRef.current;
      vid.addEventListener('ended', this._setVideoEnded, false);
    });
  }

  _seenVideoClip() {
    this.state.results["crop_choice"].push(true);
    this.setState({
      percent: Math.min(this.state.percent + 100/this.state.cropVideos.length, 100),
    })
    if (this.state.currentIndex === this.state.cropVideos.length - 1) {
      this.setState({completed: true, videoEnded2: true});
      this._submitHITform();
      return;
    }
    this.setState({
      currentIndex: this.state.currentIndex + 1,
      videoEnded2: false,
    }, () => {
      const vid = this.videoRef.current;
      vid.addEventListener('ended', this._setVideoEnded2, false);
    })
  }

  _notSeenVideoClip() {
    this.state.results["crop_choice"].push(false);
    this.setState({
      percent: Math.min(this.state.percent + 100/this.state.cropVideos.length, 100),
    })
    if (this.state.currentIndex === this.state.cropVideos.length - 1) {
      this.setState({completed: true, videoEnded2: true});
      this._submitHITform();
      return;
    }
    this.setState({
      currentIndex: this.state.currentIndex + 1,
      videoEnded2: false,
    }, () => {
      const vid = this.videoRef.current;
      vid.addEventListener('ended', this._setVideoEnded2, false);
    })
  }

  _submitHITform() {
    var submitUrl = decodeURIComponent(this._gup("turkSubmitTo")) + MTURK_SUBMIT_SUFFIX;
    var form = $("#submit-form");

    console.log("Gup output for assignmentId, workerId:", this._gup("assignmentId"),this._gup("workerId"))
    this._addHiddenField(form, 'assignmentId', this._gup("assignmentId"));
    this._addHiddenField(form, 'workerId', this._gup("workerId"));
    this._addHiddenField(form, 'taskTime', (Date.now() - this.state.timer)/1000);
    this._addHiddenField(form, 'feedback', $("#feedback-input").val());
    this.state.results["data"] = this.state.data;
    this.state.results["filename"] = this.state.filename;
    var results = {
        'outputs': this.state.results,
    };
    this._addHiddenField(form, 'results', JSON.stringify(results));
    $("#submit-form").attr("action", submitUrl);
    $("#submit-form").attr("method", "POST");
    $("#submit-form").submit();
  }

  _addHiddenField(form, name, value) {
    // form is a jQuery object, name and value are strings
    var input = $("<input type='hidden' name='" + name + "' value=''>");
    input.val(value);
    form.append(input);
  }

  _gup(name) {
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var tmpURL = window.location.href;
    var results = regex.exec(tmpURL);
    if (results == null) return "";
    else return results[1];
  }

  _handleTextChange(e) {
    this.setState({
      textInput: e.target.value,
    });
  }
  
  _completeCountdown() {
    this.setState({
      countdown: false,
    }, () => {
      const vid = this.videoRef.current;
      vid.addEventListener('ended', this._setVideoEnded2, false);
    })
  }
  
  render() {
    const { classes } = this.props;
    const { cropSection, cropVideos, currentIndex,
      longVideos, percent, textFieldButtonText,
      textInput, videoEnded, videoSize,
      completed, videoEnded2, disableButton,
      countdown } = this.state;

    return (
      <MuiThemeProvider theme={THEME}>
        <div className={classes.root}>

          <div className={classes.topSection}>
            <Typography variant="h2" style={{marginBottom: 16}}>
              Most Memorable Moment
            </Typography>
            <Typography variant="subtitle1" align="center" style={{marginBottom: 16}}>
              <b>Instructions:</b> <br />
              Please watch the entire video, then write a description
              about the video of more than 8 words.
            </Typography>
            <div className={classes.levelProgress}>
              <Typography variant="caption">
                Level Progress:
              </Typography>
              <Progress
                style={{width: '70%', marginLeft: 8}}
                percent={Math.ceil(percent)}
                theme={{
                  active: {
                    symbol: Math.ceil(percent) + '%',
                    color: 'green'
                  },
                  success: {
                    symbol: Math.ceil(percent) + '%',
                    color: 'green'
                  }
                }}
              />
            </div>
          </div>
          
          <div className={classes.videoSection}>
            {
              videoEnded ?
                <div className={classes.textFieldContainer}>
                  <form noValidate autoComplete="off">
                    <TextField
                      id="outlined-multiline-static"
                      label="Enter Description"
                      multiline
                      className={classes.textField}
                      rows={4}
                      defaultValue={textInput}
                      onChange={this._handleTextChange}
                      variant="outlined"
                    />
                  </form>
                  <Button variant="contained" 
                          className={classes.textSubmitButton}
                          onClick={this._handleButtonClick}>
                    {textFieldButtonText}
                  </Button>
                  
                </div>
              :
                (
                  countdown ? 
                    <div className={classes.countdownTimer}>
                      <Counter
                        countdownComplete={() => this.setState({disableButton: false})}
                        clickFunction={this._completeCountdown}
                        disableButton={disableButton}
                        textFieldButtonText={textFieldButtonText} 
                      />               
                    </div>  
                  :
                    (
                      cropSection ?
                        <div className={classes.videoContainer}>
                          {!videoEnded2 ?
                              <video
                                id="myVideo"
                                src={cropVideos[currentIndex]}
                                width={videoSize}
                                ref={this.videoRef}
                                autoPlay
                                muted
                              />

                            :
                              (
                                completed ?
                                  <Typography style={{marginTop: 16}} variant="h5" align="center" gutterBottom>
                                    Thank you for completing the experiment.
                                  </Typography>
                                :
                                  <div className={classes.buttonsContainer}>
                                    <Button variant="contained" className={classes.leftButton} onClick={this._notSeenVideoClip}>
                                      Haven't Seen Clip
                                    </Button>
                                    <Button variant="contained" className={classes.rightButton} onClick={this._seenVideoClip}>
                                      Seen Video Clip
                                    </Button>
                                  </div>
                              )
                        }
                        </div> 
                      :
                        <div className={classes.videoContainer}>
                          <video
                            id="myVideo"
                            src={longVideos[currentIndex]}
                            width={videoSize}
                            ref={this.videoRef}
                            autoPlay
                            muted
                          />
                        </div> 
                    )
                )
            }
          </div>
          <Typography className={classes.irb} variant="caption">
            This HIT is part of a MIT scientific research project. Your decision to complete this HIT is voluntary. There is no way for us to identify you. The only information we will have, in addition to your responses, is the time at which you completed the study. The results of the research may be presented at scientific meetings or published in scientific journals. Clicking on the 'SUBMIT' button on the bottom of this page indicates that you are at least 18 years of age and agree to complete this HIT voluntarily.
          </Typography>
        </div>
      </MuiThemeProvider>
    )
  }
}

function Counter(props) {
  const [counter, setCounter] = React.useState(599);
  React.useEffect(() => {
    counter > 0 && setTimeout(() => setCounter(counter - 1), 1000);
    if (counter === 0) {
      props.countdownComplete();
    }
  }, [counter]);

  return (
    <React.Fragment>
      <Typography variant="h5" align="center">
        You will now take a 10 minute break before completing the next section.
        <br />
        Please feel free to do other tasks before returning to this task. 
        <br />
        You will be able to click the button to continue once the timer reaches 0.
      </Typography>
      <Typography variant="h2">
        Countdown: {Math.floor(counter / 60)}:{counter % 60 < 10 ? "0" + counter % 60 : counter % 60}
      </Typography>
      <Button variant="contained" 
              disabled={props.disableButton}
              onClick={props.clickFunction}>
        {props.textFieldButtonText}
      </Button>
    </React.Fragment>
  );
}

export default withStyles(styles)(Interface);