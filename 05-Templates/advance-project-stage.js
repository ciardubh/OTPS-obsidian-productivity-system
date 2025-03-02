// simplified-advance-project-stage.js
module.exports = async function(params) {
  const { app, quickAddApi } = params;
  
  try {
    // Get the current file
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile || !activeFile.path.startsWith("01-Projects/")) {
      console.log("Please open a project file first.");
      return;
    }
    
    // Read the file content
    const content = await app.vault.read(activeFile);
    
    // Extract the current stage using frontmatter
    const stageFrontmatterRegex = /stage: ([a-z]+)/;
    const stageMatch = content.match(stageFrontmatterRegex);
    
    if (!stageMatch) {
      console.log("Couldn't find the stage property in frontmatter.");
      return;
    }
    
    const currentStage = stageMatch[1];
    
    // Define the stage progression based on your project template
    const stages = ["planning", "creation", "review", "delivery"];
    
    // Find the current stage index
    const currentIndex = stages.indexOf(currentStage);
    
    if (currentIndex === -1) {
      console.log(`Unknown stage: ${currentStage}`);
      return;
    }
    
    // Check if this is the last stage
    if (currentIndex === stages.length - 1) {
      // Prompt to confirm project completion
      const shouldComplete = await quickAddApi.yesNoPrompt(
        "This will mark the project as complete. Continue?",
        "Complete Project"
      );
      
      if (shouldComplete) {
        // Update to completed status
        const updatedContent = content
          .replace(/status: Active/, "status: Complete")
          .replace(/stage: delivery/, "stage: complete");
        
        await app.vault.modify(activeFile, updatedContent);
        
        // Ask if the project should be moved to archive
        const shouldArchive = await quickAddApi.yesNoPrompt(
          "Move this project to the archive?",
          "Archive Project"
        );
        
        if (shouldArchive) {
          // Move to archive folder
          const newPath = activeFile.path.replace("01-Projects/", "04-Archive/");
          await app.vault.rename(activeFile, newPath);
          console.log("Project completed and archived.");
          
          // Open the archived file
          const archivedFile = app.vault.getAbstractFileByPath(newPath);
          if (archivedFile) {
            app.workspace.getLeaf().openFile(archivedFile);
          }
        } else {
          console.log("Project marked as complete but not archived.");
        }
      }
      return;
    }
    
    // Advance to the next stage
    const nextStage = stages[currentIndex + 1];
    
    // Update the frontmatter
    const updatedContent = content.replace(
      stageFrontmatterRegex,
      `stage: ${nextStage}`
    );
    
    // Update the Current Stage heading
    const currentStageHeadingRegex = new RegExp(
      `## Current Stage: ${currentStage.charAt(0).toUpperCase() + currentStage.slice(1)}`,
      "i"
    );
    
    const nextStageFormatted = nextStage.charAt(0).toUpperCase() + nextStage.slice(1);
    const finalContent = updatedContent.replace(
      currentStageHeadingRegex,
      `## Current Stage: ${nextStageFormatted}`
    );
    
    // Save the updated content
    await app.vault.modify(activeFile, finalContent);
    
    console.log(`Project advanced from ${currentStage} to ${nextStage}.`);
    
  } catch (error) {
    console.error("Error in Advance Project Stage:", error);
  }
}