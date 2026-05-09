import React from 'react';
import GoogleMeetInterviewRoom from '../GoogleMeetInterviewRoom';

// No auth guard — anyone with the room link can join
export default function InterviewRoom() {
  return <GoogleMeetInterviewRoom />;
}
