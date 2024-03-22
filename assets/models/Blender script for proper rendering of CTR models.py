import bpy

# this script normally only checks the materials of a single object

obj=bpy.data.objects["crash_hi"]
mats_slots=obj.material_slots
for mat_name in mats_slots.keys():
    mat=bpy.data.materials[mat_name]

# however you can instead make it cycle through all materials in the scene by uncommenting the two lines below and commenting the four lines above
#for mat_name in bpy.data.materials:
    #mat=mat_name

    mat.blend_method="CLIP"
    
    nodes=mat.node_tree.nodes
    links=mat.node_tree.links
    
    # remove all material nodes that aren't the image or output node
    image_node=nodes.get("Image Texture")
    output_node=nodes.get("Material Output")
    for node in nodes:
        if node!=image_node and node!=output_node:
            nodes.remove(node)
            
    output_node.location=(700,150)

    # disable filtering on textures
    image_node.interpolation="Closest"
            
    # add attribute node set to a mesh's vertex color attribute
    Col=nodes.new(type="ShaderNodeAttribute")
    Col.attribute_name="Color" # the vertex color attribute on these meshes is called "Color"
    Col.location=(-350,-150)
    
    # set up node that will mix the mesh's vertex colors with the texture's colors
    Mix=nodes.new(type="ShaderNodeMixRGB")
    Mix.blend_type="MULTIPLY"
    Mix.location=(-150,0)
    Mix.inputs[0].default_value=1
    
    # this node will multiply the vertex colors by 4
    # I believe this looks most identical to the PS1's vertex colors, even though that should only require multiplying by 2
    Mult=nodes.new(type="ShaderNodeMixRGB")
    Mult.blend_type="MULTIPLY"
    Mult.location=(50,150)
    Mult.inputs[0].default_value=1.0
    Mult.inputs[2].default_value=(4,4,4,1)
    
    # set up node for image's alpha channel
    Alpha=nodes.new(type="ShaderNodeBsdfTransparent")
    Alpha.location=(250,-100)

    # the alpha channel node needs to be inverted in order to work properly for whatever reason
    Invert=nodes.new(type="ShaderNodeInvert")
    Invert.inputs[0].default_value=1
    Invert.location=(250,300)

    # the node that mixes the texture, the vertex color, and the alpha channel nodes altogether
    RGBA=nodes.new(type="ShaderNodeMixShader")
    RGBA.location=(500,150)
    
    # establish links to each node
    links.new(image_node.outputs[0],Mix.inputs[1])
    links.new(Col.outputs[0],Mix.inputs[2])
    links.new(Mix.outputs[0],Mult.inputs[1])
    links.new(image_node.outputs[1],Invert.inputs[1])
    links.new(Invert.outputs[0],RGBA.inputs[0])
    links.new(Mult.outputs[0],RGBA.inputs[1])
    links.new(Alpha.outputs[0],RGBA.inputs[2])
    links.new(RGBA.outputs[0],output_node.inputs[0])
    
    # if the texture uses the PS1's 50% transparency blending
    if mat.name.find("_0", len(mat.name)-2, len(mat.name)) == len(mat.name)-2:
        mat.blend_method="BLEND"
    
    # if the texture uses the PS1's additive blending
    if mat.name.find("_1", len(mat.name)-2, len(mat.name)) == len(mat.name)-2:
        mat.blend_method="BLEND"
        Alpha2=nodes.new(type="ShaderNodeBsdfTransparent")
        Alpha2.location=(250,-200)
        Add=nodes.new(type="ShaderNodeAddShader")
        Add.location=(500,0)
        links.new(RGBA.outputs[0],Add.inputs[0])
        links.new(Alpha2.outputs[0],Add.inputs[1])
        links.new(Add.outputs[0],output_node.inputs[0])