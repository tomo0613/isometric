const _tmp = {};

export default {
    walk: {
        init: (subject, path) => {
            if (!path.length) {
                return;
            }
            _tmp.path = path;
            _tmp.onTargetReach = () => {
                _tmp.path.shift();

                if (_tmp.path.length) {
                    subject.moveTo(_tmp.path[0]);
                } else {
                    subject.terminateAction();
                }
            };

            subject.changeListener.addListener('targetReached', _tmp.onTargetReach);
            subject.moveTo(_tmp.path[0]);
        },
        terminate: (subject) => {
            subject.changeListener.removeListener('targetReached', _tmp.onTargetReach);
        },
    },
    idle: {},
};
