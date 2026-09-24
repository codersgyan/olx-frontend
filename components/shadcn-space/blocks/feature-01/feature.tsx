import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

type Features = {
  icon: LucideIcon;
  content: string;
}[];

const Feature = ({ featureData }: { featureData: Features }) => {
  return (
    <section id="features">
      <div className="lg:py-20 sm:py-16 py-8 ">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-col gap-8 md:gap-12">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
              className="flex flex-col md:flex-row items-center md:items-end justify-center md:justify-between gap-4"
            >
              <div className="flex flex-col gap-4 max-w-full items-center md:items-start text-center md:text-left md:max-w-xl">
                <Badge
                  variant={"outline"}
                  className="px-3 py-1 h-auto text-sm font-normal"
                >
                  Features
                </Badge>
                <h2 className="text-3xl md:text-4xl font-semibold">
                  Buy & sell smarter
                </h2>
                <p className="text-lg font-normal text-muted-foreground">
                  From listing to checkout, Coder&apos;s Shop gives you the tools
                  to trade safely, find deals, and connect with buyers and
                  sellers near you.
                </p>
              </div>
              <Button className="rounded-full px-5 py-2.5 shadow-xs h-auto cursor-pointer">
                <a href="#">Start selling</a>
              </Button>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.8,
                  ease: [0.21, 0.47, 0.32, 0.98],
                }}
                className="p-6 sm:p-16 rounded-2xl bg-[url('/feature2.jpg')] object-cover bg-center h-full w-full bg-cover bg-no-repeat"
              >
                <Card className="flex items-start gap-12 has-data-[slot=card-footer]:pb-6! sm:has-data-[slot=card-footer]:pb-10! pt-6 sm:py-10 border-none shadow-none ring-0 rounded-lg opacity-95">
                  <CardContent className="flex flex-col gap-6 px-6 sm:px-8">
                    <Avatar className="size-12">
                      <AvatarFallback>
                        <img
                          src="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2740%27%20height%3D%2740%27%20viewBox%3D%270%200%2040%2040%27%3E%3Ccircle%20cx%3D%2720%27%20cy%3D%2720%27%20r%3D%2720%27%20fill%3D%27%2523ec4899%27/%3E%3Ctext%20x%3D%2750%2525%27%20y%3D%2750%2525%27%20dominant-baseline%3D%27central%27%20text-anchor%3D%27middle%27%20font-family%3D%27sans-serif%27%20font-size%3D%2716%27%20font-weight%3D%27600%27%20fill%3D%27white%27%3EP%3C/text%3E%3C/svg%3E"
                          alt="Seller avatar"
                          className="rounded-full"
                        />
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl sm:text-2xl font-medium">
                      &ldquo;Before Coder&apos;s Shop, selling unused gadgets was a
                      hassle. Now I list in minutes and connect with serious
                      buyers in hours.&rdquo;
                    </h3>
                  </CardContent>
                  <CardFooter className="bg-card border-none w-full px-6 sm:px-8 py-0 flex flex-col items-start gap-0.5">
                    <p className="text-sm font-medium text-primary">
                      Mini
                    </p>
                    <span className="text-xs font-normal text-muted-foreground">
                      Seller @Coder&apos;s Shop
                    </span>
                  </CardFooter>
                </Card>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
                {featureData?.map((value, index) => {
                  return (
                    <motion.div
                      key={index}
                      initial={{ x: 100, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.8,
                        ease: [0.21, 0.47, 0.32, 0.98],
                      }}
                    >
                      <Card className="py-8 bg-muted ring-0 border-0 h-full">
                        <CardContent className="w-full h-full px-8 flex flex-col items-start gap-12 justify-between">
                          <value.icon
                            className="w-6 h-6 text-muted-foreground"
                            strokeWidth={1.5}
                          />
                          <p className="text-base text-primary font-normal">
                            {value?.content}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Feature;
