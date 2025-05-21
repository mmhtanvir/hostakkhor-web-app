import { Bookmark, Users, Calendar, Newspaper, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const mockUserCommunities = [
  { id: 1, name: "Urban Farmers" },
  { id: 2, name: "Organic Growers" },
  { id: 3, name: "Local Food Network" },
];

const mockEvents = [
  { id: 1, name: "Farmers Market", date: "Jan 20" },
  { id: 2, name: "Gardening Workshop", date: "Jan 25" },
];

const mockNews = [
  { id: 1, title: "New Sustainable Farming Methods" },
  { id: 2, title: "Local Food Security Initiative" },
];

export const DesktopSidebar = () => {
  return (
    <div className="space-y-6">
      {/* Saved Items */}
      <div>
        <Link to="/#">
          <Button variant="ghost" className="w-full justify-start gap-2 mb-2">
            <Bookmark className="w-5 h-5" />
            Saved Items
          </Button>
        </Link>
      </div>

      {/* User's Communities */}
      <div>
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="font-semibold text-sm">Your Communities</h3>
          <Link to="/communities" className="text-xs text-muted-foreground hover:text-primary flex items-center">
            See All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-1">
          {mockUserCommunities.map((community) => (
            <Link key={community.id} to={`/community/1`}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                <Users className="w-4 h-4" />
                {community.name}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="font-semibold text-sm">Upcoming Events</h3>
          <Link to="/#" className="text-xs text-muted-foreground hover:text-primary flex items-center">
            See All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-1">
          {mockEvents.map((event) => (
            <Link key={event.id} to={`/#/${event.id}`}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <div className="flex items-center gap-2 w-full">
                  <Calendar className="w-4 h-4" />
                  <div className="flex justify-between w-full">
                    <span className="text-sm">{event.name}</span>
                    <span className="text-xs text-muted-foreground">{event.date}</span>
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Latest News */}
      <div>
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="font-semibold text-sm">Latest News</h3>
          <Link to="/#" className="text-xs text-muted-foreground hover:text-primary flex items-center">
            See All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-1">
          {mockNews.map((item) => (
            <Link key={item.id} to={`/#/${item.id}`}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                <Newspaper className="w-4 h-4" />
                <span className="text-sm truncate">{item.title}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};