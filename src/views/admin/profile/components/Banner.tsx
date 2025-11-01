import React from "react";
import banner from "assets/img/profile/banner.png";
import Card from "components/card";
import { useUser } from "contexts/UserContext";
import { MdEdit } from "react-icons/md";
import { FiUser } from "react-icons/fi";
import ProfileEditModal from "components/modal/ProfileEditModal";

const Banner = () => {
  const { user } = useUser();
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  return (
    <>
      <Card extra={"items-center w-full h-full p-[16px] bg-cover"}>
        {/* Background and profile */}
        <div
          className="relative mt-1 flex h-32 w-full justify-center rounded-xl bg-cover"
          style={{ backgroundImage: `url(${banner})` }}
        >
          <div className="absolute -bottom-12 flex h-[87px] w-[87px] items-center justify-center rounded-full border-[4px] border-white bg-gray-200 dark:bg-navy-600 dark:!border-navy-700 flex-shrink-0 overflow-hidden">
            {user?.image ? (
              <img className="h-full w-full rounded-full object-cover flex-shrink-0" src={user.image} alt={user?.fullname || "User"} />
            ) : (
              <FiUser className="h-10 w-10 text-gray-500 dark:text-gray-400" />
            )}
          </div>
          {/* Edit button */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-50 dark:bg-navy-700 dark:hover:bg-navy-600"
            title="Edit Profile"
          >
            <MdEdit className="h-4 w-4 text-gray-600 dark:text-white" />
          </button>
        </div>

        {/* Name and position */}
        <div className="mt-16 flex flex-col items-center">
          <h4 className="text-xl font-bold text-navy-700 dark:text-white">
            {user?.fullname || "User Name"}
          </h4>
          <p className="text-base font-normal text-gray-600">{user?.phone || "No phone provided"}</p>
        </div>

        {/* Post followers */}
        <div className="mt-6 mb-3 flex gap-4 md:!gap-14">
          <div className="flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-navy-700 dark:text-white">17</p>
            <p className="text-sm font-normal text-gray-600">Posts</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-navy-700 dark:text-white">
              9.7K
            </p>
            <p className="text-sm font-normal text-gray-600">Followers</p>
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="text-2xl font-bold text-navy-700 dark:text-white">
              434
            </p>
            <p className="text-sm font-normal text-gray-600">Following</p>
          </div>
        </div>
      </Card>

      {/* Profile Edit Modal */}
      <ProfileEditModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
    </>
  );
};

export default Banner;
