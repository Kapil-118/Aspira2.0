import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, GraduationCap, Github, Linkedin, Award } from 'lucide-react';
import { getMediaUrl } from '../utils/media';

const MentorCard = ({ mentor, onConnect, connectionStatus }) => {
  const getStatusButton = () => {
    switch (connectionStatus) {
      case 'accepted':
        return (
          <Link
            to="/chat"
            className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 py-2 px-4 rounded-xl text-xs font-semibold text-center block transition-all"
          >
            Chat Active
          </Link>
        );
      case 'pending':
        return (
          <button
            disabled
            className="w-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 py-2 px-4 rounded-xl text-xs font-semibold cursor-not-allowed"
          >
            Request Sent
          </button>
        );
      case 'rejected':
        return (
          <button
            onClick={() => onConnect(mentor.userId?._id || mentor.userId)}
            className="w-full bg-red-600/20 hover:bg-indigo-600 text-red-300 hover:text-white border border-red-500/20 py-2 px-4 rounded-xl text-xs font-semibold transition-all"
          >
            Reconnect
          </button>
        );
      default:
        return (
          <button
            onClick={() => onConnect(mentor.userId?._id || mentor.userId)}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded-xl text-xs font-semibold shadow-md hover:shadow-indigo-500/20 transition-all"
          >
            Connect Mentor
          </button>
        );
    }
  };

  const getProfileImage = () => {
    if (mentor.profilePhoto) {
      return getMediaUrl(mentor.profilePhoto);
    }
    return 'https://img.icons8.com/color/96/user.png';
  };

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col justify-between h-[360px] relative overflow-hidden group">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>

      <div>
        {/* Header Metadata */}
        <div className="flex items-center gap-4 mb-4">
          <img
            src={getProfileImage()}
            alt={mentor.name}
            className="w-14 h-14 rounded-full object-cover border border-white/10 group-hover:border-indigo-500/50 transition-all"
          />
          <div className="text-left">
            <h3 className="font-bold text-gray-100 group-hover:text-indigo-400 transition-colors">
              {mentor.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {mentor.department} • Year {mentor.year}
              </span>
            </div>
          </div>
        </div>

        {/* Bio Text */}
        <p className="text-xs text-gray-400 line-clamp-3 mb-4 leading-relaxed text-left">
          {mentor.bio || 'Experienced mentor eager to guide students in technical stacks and career mapping.'}
        </p>

        {/* Skills Tag Array */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {mentor.skills && mentor.skills.length > 0 ? (
            mentor.skills.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="text-[10px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/5 px-2 py-0.5 rounded-md"
              >
                {skill}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-gray-500">No specific skills listed.</span>
          )}
          {mentor.skills && mentor.skills.length > 3 && (
            <span className="text-[10px] text-indigo-400/80 font-semibold self-center">
              +{mentor.skills.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col gap-3 mt-auto">
        <div className="flex items-center justify-between text-gray-500 px-1 border-t border-white/5 pt-3">
          <span className="text-[10px] uppercase tracking-wider font-semibold">Social Portfolios</span>
          <div className="flex items-center gap-2.5">
            {mentor.userId?.github && (
              <a
                href={mentor.userId.github}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition"
              >
                <Github className="w-3.5 h-3.5" />
              </a>
            )}
            {mentor.userId?.linkedin && (
              <a
                href={mentor.userId.linkedin}
                target="_blank"
                rel="noreferrer"
                className="hover:text-indigo-400 transition"
              >
                <Linkedin className="w-3.5 h-3.5" />
              </a>
            )}
            {mentor.userId?.email && (
              <a href={`mailto:${mentor.userId.email}`} className="hover:text-red-400 transition">
                <Mail className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {getStatusButton()}
      </div>
    </div>
  );
};

export default MentorCard;
