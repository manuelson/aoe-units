import { AvatarFallback, AvatarImage, Avatar } from "./ui/avatar";

export const AvatarUi = ({
  name,
  avatar,
  h = "h-10",
  w = "w-10",
}: {
  name: string;
  avatar: string;
  h?: string;
  w?: string;
}) => {
  return (
    <Avatar className={`${h} ${w} ring-2 ring-gray-100 dark:ring-gray-800`}>
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
