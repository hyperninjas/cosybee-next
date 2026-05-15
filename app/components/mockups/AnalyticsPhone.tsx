import EpcCard from "./phone/EpcCard";
import PhoneBottomNav from "./phone/PhoneBottomNav";
import PhoneFrame from "./phone/PhoneFrame";
import PhoneGreeting from "./phone/PhoneGreeting";
import PhoneTabs from "./phone/PhoneTabs";
import RatingBars from "./phone/RatingBars";

/** Full cosybee analytics phone: EPC card + rating bars + tariff + bottom nav. */
export default function AnalyticsPhone({
  className = "",
}: {
  className?: string;
}) {
  return (
    <PhoneFrame className={className}>
      <PhoneGreeting />
      <PhoneTabs />
      <EpcCard />
      <RatingBars />
      <div className="mx-3 mt-3 border-t border-neutral-200 pt-2">
        <p className="text-[10px] font-bold text-black">Tariff &amp; provider</p>
      </div>
      <PhoneBottomNav />
    </PhoneFrame>
  );
}
