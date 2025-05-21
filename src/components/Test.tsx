import { getQuarksInstance } from "@/api/quarksInstance";
import { IUser } from "@/lib/utils";
import React from "react";
import { Button } from "./ui/button";

const TestComponent = () => {
    async function syncUsersToFuzzy() {
        const quarksClient = getQuarksInstance();
        const usersCollection = quarksClient.collection<IUser>("users");
    
        try {
            console.log("Fetching users from main database...");
            const users = await usersCollection.orderBy("created_at", "desc").limit(500).get();
            console.log(`Found ${users.length} users`, users);
    
            console.log("\nStarting sync to fuzzy search...");
            let insertedCount = 0;
            let alreadyExistsCount = 0;
            let errorCount = 0;
    
            for (const user of users) {
                // if user.name not found then continue to next loop
                if (!user.name) continue;
                try {
                    // Try to search for the user in fuzzy search
                    const searchResult = await quarksClient.searchFuzzyWord({
                        word: user.name || '',
                        maxedits: 0 // Exact match only for checking existence
                    });
    
                    if (!searchResult || !searchResult.length) {
                        // User not found in fuzzy search, insert them
                        await quarksClient.insertFuzzyWord({
                            word: user.name || '',
                            tag: 'user',
                            meta: user.id
                        });
                        insertedCount++;
                        console.log(`✓ Inserted user: ${user.name}`);
                    } else {
                        alreadyExistsCount++;
                        console.log(`- User already exists: ${user.name}`);
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`✗ Error processing user ${user.name}:`, error);
                }
    
                // Add a small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 100));
            }
    
            console.log("\nSync completed!");
            console.log("Summary:");
            console.log(`- Total users processed: ${users.length}`);
            console.log(`- Users inserted: ${insertedCount}`);
            console.log(`- Users already in fuzzy search: ${alreadyExistsCount}`);
            console.log(`- Errors encountered: ${errorCount}`);
    
        } catch (error) {
            console.error("Failed to sync users to fuzzy search:", error);
        }
    }
    
    return(
        <div>
            <Button onClick={syncUsersToFuzzy}>Sync Users to Fuzzy Search</Button>
        </div>
    )
}

export default TestComponent;