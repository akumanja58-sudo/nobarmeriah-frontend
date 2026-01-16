// GoalNotificationPortal.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import GoalNotification from './GoalNotification';

const GoalNotificationPortal = (props) => {
    if (!props.show) return null;

    return createPortal(
        <GoalNotification {...props} />,
        document.body
    );
};

export default GoalNotificationPortal;