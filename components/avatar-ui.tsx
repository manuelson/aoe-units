import { AvatarFallback, AvatarImage, Avatar } from "./ui/avatar";

export const AvatarUi = ({
  name,
  avatar,
}: {
  name: string;
  avatar: string;
}) => {
  return (
    <Avatar className="h-10 w-10 ring-2 ring-gray-100 dark:ring-gray-800">
      <AvatarImage
        loading="lazy"
        src={`/units/${avatar}.png`}
        alt={name}
        className="bg-black"
      />
      <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
        {name.slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  );
};
