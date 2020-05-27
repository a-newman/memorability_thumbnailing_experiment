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
      cropSection: false,
      cropVideos: data["crops"],
      currentIndex: 0,
      longVideos: data["long_videos"],
      percent: 0,
      results: {"video_captions": [], "crop_choice": []},
      textFieldButtonText: "Next",
      textInput: "",
      timer: Date.now(),
      videoEnded: false,
      videoSize: 360,
    };

    this.videoRef = React.createRef();

    this._setVideoEnded = this._setVideoEnded.bind(this);
    this._submitHITform = this._submitHITform.bind(this);
    this._handleTextChange = this._handleTextChange.bind(this);
    this._handleButtonClick = this._handleButtonClick.bind(this);
    this._loadNextVideo = this._loadNextVideo.bind(this);
    this._loadCropVideos = this._loadCropVideos.bind(this);
    this._seenVideoClip = this._seenVideoClip.bind(this);
    this._notSeenVideoClip = this._notSeenVideoClip.bind(this);
  
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
        percent: Math.round(Math.min((0) / data["long_videos"].length * 100, 100)),
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

  _handleButtonClick() {
    if (this.state.textFieldButtonText === "Next") {
      this._loadNextVideo();
    } else if (this.state.textFieldButtonText == "Continue to Next Section") {
      this.setState({
        videoEnded: false,
        cropSection: true,
        currentIndex: 0,
        percent: 0,
      }, () => this._loadCropVideos());
    }
  }

  _loadCropVideos() {
    console.log("called", this.state);
    const vid = this.videoRef.current;
    vid.removeEventListener("ended", this._setVideoEnded, false)  
  }

  _loadNextVideo() {
    if (this.state.textInput.length < 10) {
      alert("Please enter a description of the video before continuing.");
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
      vid.addEventListener('ended', this._setVideoEnded, false)
    });
  }

  _seenVideoClip() {
    this.state.results["crop_choice"].push(true);
    this.setState({
      percent: Math.min(this.state.percent + 100/this.state.cropVideos.length, 100),
    })
    if (this.state.currentIndex === this.state.cropVideos.length - 1) {
      console.log("results: ", this.state.results);
      this.setState({completed: true});
      this._submitHITform();
    }
    this.setState({
      currentIndex: this.state.currentIndex + 1,
    })
  }

  _notSeenVideoClip() {
    this.state.results["crop_choice"].push(false);
    this.setState({
      percent: Math.min(this.state.percent + 100/this.state.cropVideos.length, 100),
    })
    if (this.state.currentIndex === this.state.cropVideos.length - 1) {
      console.log("results: ", this.state.results);
      this.setState({completed: true});
      this._submitHITform();
    }
    this.setState({
      currentIndex: this.state.currentIndex + 1,
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
  

  render() {
    const { classes } = this.props;
    const { cropSection, cropVideos, currentIndex,
      longVideos, percent, textFieldButtonText,
      textInput, videoEnded, videoSize,
      completed } = this.state;
    
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
                  cropSection ?
                    <div className={classes.videoContainer}>
                      <video
                        id="myVideo"
                        src={cropVideos[currentIndex]}
                        width={videoSize}
                        height={videoSize}
                        ref={this.videoRef}
                        autoPlay
                        muted
                        loop
                      />
                      {
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
                      }
                    </div> 
                  :
                    <div className={classes.videoContainer}>
                      <video
                        id="myVideo"
                        src={longVideos[currentIndex]}
                        width={videoSize}
                        height={videoSize}
                        ref={this.videoRef}
                        autoPlay
                        muted
                        controls
                      />
                    </div> 
                )
            }
          </div>
        </div>
      </MuiThemeProvider>
    )
  }
}

export default withStyles(styles)(Interface);